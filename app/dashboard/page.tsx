// File: app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import type { Company, PreClaim, Profile } from '@/lib/types/database';
import type { ClaimWithEmployee } from '@/lib/types/dashboard';
import { getDashboardBundle } from './actions';
import { OverviewStats } from '@/components/dashboard/overview-stats';
import { FeatureShowcase } from '@/components/dashboard/feature-showcase';
import { EmployeesPanel } from '@/components/dashboard/employees-panel';
import { ClaimsPanel } from '@/components/dashboard/claims-panel';
import { FraudCenterPanel } from '@/components/dashboard/fraud-center-panel';
import { PayrollPanel } from '@/components/dashboard/payroll-panel';
import { ProfileSettingsModal } from '@/components/account/profile-settings-modal';

export default function DashboardPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'employees' | 'claims' | 'fraud'>('employees');
  const [data, setData] = useState<{
    company: Company;
    employees: Profile[];
    claims: ClaimWithEmployee[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getDashboardBundle().then((result) => {
      if (!active) return;
      if (result.success && result.company && result.employees && result.claims) {
        setData({ company: result.company, employees: result.employees, claims: result.claims });
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  const pendingCount = data.claims.filter((c) => c.status === 'pending').length;
  const needsReviewCount = data.claims.filter((c) => c.status === 'needs_review').length;
  const suspiciousCount = data.claims.filter((c) => c.status === 'fraud_flagged').length;
  const matchedClaims: PreClaim[] = data.claims.filter((c) => c.status === 'matched');

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      {/* شريط عنوان الشركة وإعدادات حساب المدير */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-zinc-900 dark:text-white">
              {data.company.name}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              لوحة تحكم وإدارة تقييمات الشركة
            </p>
          </div>
        </div>

        <ProfileSettingsModal />
      </div>

      <OverviewStats
        totalEmployees={data.company.current_employees_count}
        pendingClaims={pendingCount}
        needsReview={needsReviewCount}
        suspiciousReviews={suspiciousCount}
      />

      <FeatureShowcase features={data.company.enabled_features} />

      {/* شريط التبويبات الأفقي النظيف */}
      <div className="space-y-5">
        <div className="inline-grid w-full sm:w-auto grid-cols-3 gap-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1.5 border border-zinc-200/70 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('employees')}
            className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition ${
              activeTab === 'employees'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
            }`}
          >
            {t.dashboard.tabs.employees}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('claims')}
            className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition ${
              activeTab === 'claims'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
            }`}
          >
            {t.dashboard.tabs.claims}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fraud')}
            className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition ${
              activeTab === 'fraud'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
            }`}
          >
            {t.dashboard.tabs.fraud}
          </button>
        </div>

        <div>
          {activeTab === 'employees' && (
            <EmployeesPanel company={data.company} initialEmployees={data.employees} />
          )}
          {activeTab === 'claims' && (
            <ClaimsPanel company={data.company} initialClaims={data.claims} />
          )}
          {activeTab === 'fraud' && <FraudCenterPanel company={data.company} />}
        </div>
      </div>

      <PayrollPanel company={data.company} employees={data.employees} matchedClaims={matchedClaims} />
    </div>
  );
}