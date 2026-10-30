// File: app/super-admin/page.tsx
import { createClient } from '@/lib/supabase/server';
import { OverviewBento } from '@/components/super-admin/overview-bento';
import { CompanyControlPanel } from '@/components/super-admin/company-control-panel';
import type { Company } from '@/lib/types/database';

export default async function SuperAdminPage() {
  const supabase = await createClient();

  const [
    { count: activeCompanies },
    { count: reviewsMatched },
    { count: fraudBlocked },
    { data: companies },
  ] = await Promise.all([
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('pre_claims').select('*', { count: 'exact', head: true }).eq('status', 'matched'),
    supabase.from('pre_claims').select('*', { count: 'exact', head: true }).eq('status', 'fraud_flagged'),
    supabase.from('companies').select('*').order('created_at', { ascending: false }),
  ]);

  return (
    <div className="w-full min-h-screen flex flex-col">
      <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* عنوان اللوحة */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            لوحة تحكم المشرف العام
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            تحكم كامل في الميزات والصلاحيات والحصص والموظفين والشركات.
          </p>
        </div>

        {/* الإحصائيات البينتو */}
        <div className="w-full">
          <OverviewBento
            stats={{
              activeCompanies: activeCompanies ?? 0,
              reviewsMatched: reviewsMatched ?? 0,
              fraudBlocked: fraudBlocked ?? 0,
            }}
          />
        </div>

        {/* لوحة التحكم بالشركات */}
        <div className="w-full">
          <CompanyControlPanel initialCompanies={(companies ?? []) as Company[]} />
        </div>
      </div>
    </div>
  );
}