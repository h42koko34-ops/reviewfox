// File: app/dashboard/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AdminPermissions, ClaimStatus, Company, PreClaim, Profile } from '@/lib/types/database';
import type { ClaimWithEmployee, PayrollRow } from '@/lib/types/dashboard';

async function requireCompanyAdmin() {
  const supabase = await createClient();
  // قراءة الجلسة محلياً أولاً لتسريع الاستجابة، واللجوء إلى getUser فقط عند الحاجة
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('UNAUTHENTICATED');

  // استخدام adminClient لتجاوز بطء فحص RLS على كل صف بعد التحقق من المستخدم
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'company_admin' || !profile.company_id) {
    throw new Error('FORBIDDEN');
  }

  return { supabase, adminClient, profile: profile as Profile };
}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'FORBIDDEN') {
      return 'Unauthorized access.';
    }
    return err.message;
  }
  return fallback;
}

export async function getDashboardBundle(): Promise<{
  success: boolean;
  company?: Company;
  employees?: Profile[];
  claims?: ClaimWithEmployee[];
  error?: string;
}> {
  try {
    const { adminClient, profile } = await requireCompanyAdmin();
    const companyId = profile.company_id as string;

    const [{ data: company, error: companyError }, { data: employees }, { data: claims }] =
      await Promise.all([
        adminClient.from('companies').select('*').eq('id', companyId).single(),
        adminClient
          .from('profiles')
          .select('*')
          .eq('company_id', companyId)
          .eq('role', 'employee')
          .order('created_at', { ascending: false }),
        adminClient
          .from('pre_claims')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(300),
      ]);

    if (companyError || !company) {
      return { success: false, error: companyError?.message ?? 'Company not found.' };
    }

    const employeeMap = new Map((employees ?? []).map((e) => [e.id, e.full_name]));
    const enrichedClaims: ClaimWithEmployee[] = (claims ?? []).map((c) => ({
      ...(c as PreClaim),
      employee_full_name: employeeMap.get(c.employee_id) ?? null,
    }));

    return {
      success: true,
      company: company as Company,
      employees: (employees ?? []) as Profile[],
      claims: enrichedClaims,
    };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to load dashboard.') };
  }
}

export async function getSuspiciousReviews(companyId: string) {
  try {
    const { adminClient, profile } = await requireCompanyAdmin();
    const targetCompanyId = profile.company_id as string;

    const { data, error } = await adminClient
      .from('actual_reviews')
      .select('*')
      .eq('company_id', targetCompanyId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return { success: false, error: error.message };
    return { success: true, reviews: data };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to load reviews.') };
  }
}

export async function addEmployeeAsCompanyAdmin(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; employee?: Profile; error?: string }> {
  try {
    const { adminClient, profile } = await requireCompanyAdmin();
    const companyId = profile.company_id as string;

    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) return { success: false, error: 'Company not found.' };

    const permissions = company.admin_permissions as AdminPermissions;

    if (company.status !== 'active') {
      return { success: false, error: 'Your company has been suspended. Contact ReviewFox support.' };
    }
    if (!permissions.can_add_employees) {
      return { success: false, error: 'LOCKED_FEATURE' };
    }
    if (company.current_employees_count >= company.max_employees) {
      return { success: false, error: 'QUOTA_REACHED' };
    }

    const { data: createdUser, error: authError } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName, role: 'employee' },
    });

    if (authError || !createdUser?.user) {
      return { success: false, error: authError?.message ?? 'Failed to create employee account.' };
    }

    const { data: newProfile, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: createdUser.user.id,
        company_id: companyId,
        role: 'employee',
        full_name: input.fullName,
        email: input.email,
        preferred_lang: company.default_lang,
      })
      .select('*')
      .single();

    if (profileError) {
      await adminClient.auth.admin.deleteUser(createdUser.user.id);
      return { success: false, error: profileError.message };
    }

    revalidatePath('/dashboard');
    return { success: true, employee: newProfile as Profile };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to add employee.') };
  }
}

export async function updateClaimStatus(
  claimId: string,
  newStatus: Extract<ClaimStatus, 'matched' | 'rejected'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { adminClient, profile } = await requireCompanyAdmin();
    const companyId = profile.company_id as string;

    const { data: existingClaim, error: fetchError } = await adminClient
      .from('pre_claims')
      .select('id, company_id, employee_id, status')
      .eq('id', claimId)
      .eq('company_id', companyId)
      .single();

    if (fetchError || !existingClaim) {
      return { success: false, error: 'Claim not found.' };
    }

    const { error } = await adminClient
      .from('pre_claims')
      .update({ status: newStatus })
      .eq('id', claimId)
      .eq('company_id', companyId);

    if (error) {
      return { success: false, error: error.message };
    }

    if (newStatus === 'matched' && existingClaim.status !== 'matched') {
      const { data: empProfile } = await adminClient
        .from('profiles')
        .select('points')
        .eq('id', existingClaim.employee_id)
        .single();

      if (empProfile) {
        await adminClient
          .from('profiles')
          .update({ points: (empProfile.points ?? 0) + 1 })
          .eq('id', existingClaim.employee_id);
      }
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to update claim.') };
  }
}

export async function updateRewardAmount(
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, profile } = await requireCompanyAdmin();
    const { error } = await supabase
      .from('companies')
      .update({ reward_per_review: amount })
      .eq('id', profile.company_id as string);

    if (error) {
      if (error.message.includes('Forbidden')) {
        return { success: false, error: 'LOCKED_FEATURE' };
      }
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to update reward amount.') };
  }
}

export async function generatePayrollReport(): Promise<{
  success: boolean;
  base64?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const { adminClient, profile } = await requireCompanyAdmin();
    const companyId = profile.company_id as string;

    const { data: company } = await adminClient
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
    if (!company) return { success: false, error: 'Company not found.' };

    const permissions = company.admin_permissions as AdminPermissions;
    if (!permissions.can_export_excel) {
      return { success: false, error: 'LOCKED_FEATURE' };
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [{ data: employees }, { data: claims }] = await Promise.all([
      adminClient.from('profiles').select('*').eq('company_id', companyId).eq('role', 'employee'),
      adminClient
        .from('pre_claims')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'matched')
        .gte('created_at', startOfMonth.toISOString()),
    ]);

    const matchCounts = new Map<string, number>();
    (claims ?? []).forEach((c) => {
      matchCounts.set(c.employee_id, (matchCounts.get(c.employee_id) ?? 0) + 1);
    });

    const rows: PayrollRow[] = (employees ?? []).map((e) => ({
      employeeId: e.id,
      fullName: e.full_name ?? '—',
      matchedCount: matchCounts.get(e.id) ?? 0,
      totalReward: (matchCounts.get(e.id) ?? 0) * Number(company.reward_per_review),
    }));

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Payroll');

    sheet.columns = [
      { header: 'Employee', key: 'fullName', width: 28 },
      { header: 'Matched Reviews', key: 'matchedCount', width: 18 },
      { header: 'Reward Per Review', key: 'rewardPerReview', width: 20 },
      { header: 'Total Reward', key: 'totalReward', width: 18 },
    ];
    sheet.getRow(1).font = { bold: true };

    rows.forEach((row) => {
      sheet.addRow({
        fullName: row.fullName,
        matchedCount: row.matchedCount,
        rewardPerReview: Number(company.reward_per_review),
        totalReward: row.totalReward,
      });
    });

    const grandTotal = rows.reduce((sum, r) => sum + r.totalReward, 0);
    sheet.addRow({});
    const totalRow = sheet.addRow({ fullName: 'Grand Total', totalReward: grandTotal });
    totalRow.font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      success: true,
      base64,
      filename: `ReviewFox_Payroll_${company.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 7)}.xlsx`,
    };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to export payroll.') };
  }
}