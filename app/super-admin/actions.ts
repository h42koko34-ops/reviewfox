// File: app/super-admin/actions.ts
'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  AdminPermissions,
  Company,
  CompanyStatus,
  EnabledFeatures,
  LangCode,
  Profile,
} from '@/lib/types/database';

async function assertSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('UNAUTHENTICATED');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'super_admin') throw new Error('FORBIDDEN');

  return { supabase, userId: user.id };
}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'FORBIDDEN') {
      return 'Unauthorized. Super admin access required.';
    }
    return err.message;
  }
  return fallback;
}

export async function createCompanyWithAdmin(input: {
  companyName: string;
  googleReviewUrl?: string | null;
  googlePlaceId?: string | null;
  defaultLang: LangCode;
  maxEmployees: number;
  maxDailyClaims: number;
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
}): Promise<{ success: boolean; company?: Company; error?: string }> {
  try {
    const { supabase } = await assertSuperAdmin();
    const generatedWebhookSecret = `rfx_${randomBytes(16).toString('hex')}`;

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: input.companyName,
        google_review_url: input.googleReviewUrl || null,
        google_place_id: input.googlePlaceId || null,
        webhook_secret: generatedWebhookSecret,
        default_lang: input.defaultLang,
        max_employees: input.maxEmployees,
        max_daily_claims_per_employee: input.maxDailyClaims,
      })
      .select('*')
      .single();

    if (companyError || !company) {
      return { success: false, error: companyError?.message ?? 'Failed to create company.' };
    }

    const adminClient = createAdminClient();
    const { data: createdUser, error: authError } = await adminClient.auth.admin.createUser({
      email: input.adminEmail,
      password: input.adminPassword,
      email_confirm: true,
      user_metadata: { full_name: input.adminFullName, role: 'company_admin' },
    });

    if (authError || !createdUser?.user) {
      await supabase.from('companies').delete().eq('id', company.id);
      return { success: false, error: authError?.message ?? 'Failed to create company admin account.' };
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: createdUser.user.id,
      company_id: company.id,
      role: 'company_admin',
      full_name: input.adminFullName,
      email: input.adminEmail,
      preferred_lang: input.defaultLang,
    });

    if (profileError) {
      await adminClient.auth.admin.deleteUser(createdUser.user.id);
      await supabase.from('companies').delete().eq('id', company.id);
      return { success: false, error: profileError.message };
    }

    revalidatePath('/super-admin');
    return { success: true, company: company as Company };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to create company.') };
  }
}

export async function updateCompanyReviewConfig(
  companyId: string,
  config: {
    googleReviewUrl: string | null;
    googlePlaceId: string | null;
    regenerateWebhookSecret?: boolean;
  }
): Promise<{ success: boolean; company?: Company; error?: string }> {
  try {
    const { supabase } = await assertSuperAdmin();
    const updatePayload: Record<string, unknown> = {
      google_review_url: config.googleReviewUrl?.trim() || null,
      google_place_id: config.googlePlaceId?.trim() || null,
    };

    if (config.regenerateWebhookSecret) {
      updatePayload.webhook_secret = `rfx_${randomBytes(16).toString('hex')}`;
    }

    const { data, error } = await supabase
      .from('companies')
      .update(updatePayload)
      .eq('id', companyId)
      .select('*')
      .single();

    if (error || !data) return { success: false, error: error?.message ?? 'Failed to update review config.' };
    revalidatePath('/super-admin');
    return { success: true, company: data as Company };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to update review config.') };
  }
}

export async function updateEnabledFeatures(companyId: string, features: EnabledFeatures) {
  try {
    const { supabase } = await assertSuperAdmin();
    const { error } = await supabase
      .from('companies')
      .update({ enabled_features: features })
      .eq('id', companyId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/super-admin');
    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to update features.') };
  }
}

export async function updateAdminPermissions(companyId: string, permissions: AdminPermissions) {
  try {
    const { supabase } = await assertSuperAdmin();
    const { error } = await supabase
      .from('companies')
      .update({ admin_permissions: permissions })
      .eq('id', companyId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/super-admin');
    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to update permissions.') };
  }
}

export async function updateCompanyQuotas(
  companyId: string,
  quotas: { maxEmployees: number; maxDailyClaims: number }
) {
  try {
    const { supabase } = await assertSuperAdmin();
    const { error } = await supabase
      .from('companies')
      .update({
        max_employees: quotas.maxEmployees,
        max_daily_claims_per_employee: quotas.maxDailyClaims,
      })
      .eq('id', companyId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/super-admin');
    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to update quotas.') };
  }
}

export async function setCompanyStatus(companyId: string, status: CompanyStatus) {
  try {
    const { supabase } = await assertSuperAdmin();
    const { error } = await supabase.from('companies').update({ status }).eq('id', companyId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/super-admin');
    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to update company status.') };
  }
}

export async function getCompanyEmployees(
  companyId: string
): Promise<{ success: boolean; employees?: Profile[]; error?: string }> {
  try {
    const { supabase } = await assertSuperAdmin();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', companyId)
      .eq('role', 'employee')
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, employees: data as Profile[] };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to load employees.') };
  }
}

export async function addEmployeeToCompany(input: {
  companyId: string;
  fullName: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; employee?: Profile; error?: string }> {
  try {
    const { supabase } = await assertSuperAdmin();

    const { data: company } = await supabase
      .from('companies')
      .select('default_lang')
      .eq('id', input.companyId)
      .single();

    const adminClient = createAdminClient();
    const { data: createdUser, error: authError } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName, role: 'employee' },
    });

    if (authError || !createdUser?.user) {
      return { success: false, error: authError?.message ?? 'Failed to create employee account.' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: createdUser.user.id,
        company_id: input.companyId,
        role: 'employee',
        full_name: input.fullName,
        email: input.email,
        preferred_lang: company?.default_lang ?? 'ar',
      })
      .select('*')
      .single();

    if (profileError) {
      await adminClient.auth.admin.deleteUser(createdUser.user.id);
      return { success: false, error: profileError.message };
    }

    revalidatePath('/super-admin');
    return { success: true, employee: profile as Profile };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to add employee.') };
  }
}

export async function setEmployeeActiveStatus(profileId: string, isActive: boolean) {
  try {
    const { supabase } = await assertSuperAdmin();
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', profileId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/super-admin');
    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to update employee status.') };
  }
}
export async function updateCompanyDetails(
  companyId: string,
  input: {
    name: string;
    defaultLang: LangCode;
    rewardPerReview: number;
    maxEmployees: number;
    maxDailyClaims: number;
    googleReviewUrl?: string | null;
    googlePlaceId?: string | null;
  }
): Promise<{ success: boolean; company?: Company; error?: string }> {
  try {
    const { supabase } = await assertSuperAdmin();
    const { data, error } = await supabase
      .from('companies')
      .update({
        name: input.name.trim(),
        default_lang: input.defaultLang,
        reward_per_review: input.rewardPerReview,
        max_employees: input.maxEmployees,
        max_daily_claims_per_employee: input.maxDailyClaims,
        google_review_url: input.googleReviewUrl?.trim() || null,
        google_place_id: input.googlePlaceId?.trim() || null,
      })
      .eq('id', companyId)
      .select('*')
      .single();

    if (error || !data) {
      return { success: false, error: error?.message ?? 'Failed to update company details.' };
    }

    revalidatePath('/super-admin');
    return { success: true, company: data as Company };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to update company details.') };
  }
}