// File: lib/supabase/admin.ts
// SERVICE-ROLE CLIENT — server-only. Used exclusively for Supabase Auth admin
// operations (creating/deleting users). Never import this into client code.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}