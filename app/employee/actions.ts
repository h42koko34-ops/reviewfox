// File: app/employee/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { EnabledFeatures, PreClaim, Profile } from '@/lib/types/database';

interface LeaderboardEntry {
  profile_id: string;
  full_name: string | null;
  points: number;
  fraud_warnings: number;
}

async function requireEmployee() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('UNAUTHENTICATED');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'employee' || !profile.company_id) throw new Error('FORBIDDEN');

  return { supabase, profile: profile as Profile };
}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'FORBIDDEN') return 'Unauthorized access.';
    return err.message;
  }
  return fallback;
}

export async function getEmployeeBundle(): Promise<{
  success: boolean;
  profile?: Profile;
  enabledFeatures?: EnabledFeatures;
  maxDailyClaims?: number;
  todayClaimsCount?: number;
  error?: string;
}> {
  try {
    const { supabase, profile } = await requireEmployee();

    const [{ data: company, error: companyError }, { data: todayCount }] = await Promise.all([
      supabase
        .from('companies')
        .select('enabled_features, max_daily_claims_per_employee, status')
        .eq('id', profile.company_id as string)
        .single(),
      supabase.rpc('get_my_today_claims_count'),
    ]);

    if (companyError || !company) {
      return { success: false, error: 'Company not found.' };
    }
    if (company.status !== 'active') {
      return { success: false, error: 'Your company account has been suspended.' };
    }

    const defaultEnabledFeatures = {
      quick_tags: true,
      voice_notes: true,
      promo_codes: true,
      ocr_scanner: true,
      qr_gateway: true,
      whatsapp_link: true,
      keyword_hooks: true,
    } as EnabledFeatures;

    const enabledFeatures = company.enabled_features
      ? (company.enabled_features as EnabledFeatures)
      : defaultEnabledFeatures;

    return {
      success: true,
      profile,
      enabledFeatures,
      maxDailyClaims: company.max_daily_claims_per_employee,
      todayClaimsCount: typeof todayCount === 'number' ? todayCount : 0,
    };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to load employee data.') };
  }
}

export async function submitPreClaim(input: {
  expectedClientName: string;
  invoiceNumber: string;
  invoiceTimestamp: string;
  quickTags: string[] | null;
  voiceTranscript: string | null;
  verificationCode: string | null;
  ocrCapturedName: string | null;
  qrScannedAt: string | null;
  clientPhone: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationZone?: string | null;
}): Promise<{ success: boolean; claim?: PreClaim; error?: string }> {
  try {
    const { supabase, profile } = await requireEmployee();

    const { data: claim, error } = await supabase
      .from('pre_claims')
      .insert({
        company_id: profile.company_id as string,
        employee_id: profile.id,
        expected_client_name: input.expectedClientName,
        invoice_number: input.invoiceNumber,
        invoice_timestamp: input.invoiceTimestamp,
        quick_tags: input.quickTags ? { tags: input.quickTags } : null,
        voice_transcript: input.voiceTranscript,
        verification_code: input.verificationCode,
        ocr_captured_name: input.ocrCapturedName,
        qr_scanned_at: input.qrScannedAt,
        client_phone: input.clientPhone,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        location_zone: input.locationZone ?? null,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') return { success: false, error: 'DUPLICATE_INVOICE' };
      if (error.message.includes('Daily claim limit')) return { success: false, error: 'DAILY_LIMIT_REACHED' };
      return { success: false, error: error.message };
    }

    revalidatePath('/employee');
    return { success: true, claim: claim as PreClaim };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to submit pre-claim.') };
  }
}

export async function getMyClaims(): Promise<{ success: boolean; claims?: PreClaim[]; error?: string }> {
  try {
    const { supabase, profile } = await requireEmployee();
    const { data, error } = await supabase
      .from('pre_claims')
      .select('*')
      .eq('employee_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, claims: data as PreClaim[] };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to load claims.') };
  }
}

export async function getLeaderboard(): Promise<{ success: boolean; entries?: LeaderboardEntry[]; error?: string }> {
  try {
    const { supabase } = await requireEmployee();
    const { data, error } = await supabase.rpc('get_company_leaderboard');

    if (error) return { success: false, error: error.message };
    return { success: true, entries: data as LeaderboardEntry[] };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Failed to load leaderboard.') };
  }
}