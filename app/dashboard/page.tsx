// File: app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Link2, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
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

type CompanyWithGoogle = Company & {
  google_connected_email?: string | null;
  google_refresh_token?: string | null;
  google_connected_at?: string | null;
};

export default function DashboardPage() {
  const { t, dir } = useLanguage();
  const isAr = dir === 'rtl';

  const [activeTab, setActiveTab] = useState<'employees' | 'claims' | 'fraud'>('employees');
  const [data, setData] = useState<{
    company: CompanyWithGoogle;
    employees: Profile[];
    claims: ClaimWithEmployee[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // إظهار إشعار لمدير الشركة عند العودة من صفحة موافقة جوجل
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('google_connected') === 'true') {
        toast.success(
          isAr
            ? 'تم ربط حساب Google Business الخاص بشركتك بنجاح! 🎉'
            : 'Google Business account connected successfully! 🎉'
        );
        window.history.replaceState({}, '', '/dashboard');
      } else if (params.get('google_error')) {
        toast.error(
          isAr
            ? 'تعذر إكمال الربط مع جوجل، يرجى المحاولة مرة أخرى.'
            : 'Failed to connect Google account, please try again.'
        );
        window.history.replaceState({}, '', '/dashboard');
      }
    }

    let active = true;
    getDashboardBundle().then((result) => {
      if (!active) return;
      if (result.success && result.company && result.employees && result.claims) {
        setData({
          company: result.company as CompanyWithGoogle,
          employees: result.employees,
          claims: result.claims,
        });
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [isAr]);

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

  const connectedEmail = data.company.google_connected_email;
  const isGoogleConnected = Boolean(connectedEmail || data.company.google_refresh_token);

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
              {isAr ? 'لوحة تحكم وإدارة تقييمات الشركة' : 'Company Reviews Management Dashboard'}
            </p>
          </div>
        </div>

        <ProfileSettingsModal />
      </div>

      {/* كارت ربط حساب Google Business الخاص بمدير الشركة */}
      <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-white to-white dark:from-orange-500/10 dark:via-zinc-900 dark:to-zinc-900 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles className="h-4 w-4 text-orange-500 shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                {isAr
                  ? 'الربط التلقائي مع Google Business بالذكاء الاصطناعي'
                  : 'Google Business AI Auto-Integration'}
              </h2>
              {isGoogleConnected ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    {connectedEmail
                      ? `${isAr ? 'متصل:' : 'Connected:'} ${connectedEmail}`
                      : isAr
                      ? 'متصل بنجاح'
                      : 'Connected'}
                  </span>
                </span>
              ) : (
                <span className="text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
                  {isAr ? 'بانتظار ربط الحساب' : 'Not Connected'}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
              {isAr
                ? 'اربط حساب Google Business الرسمي لشركتك بضغطة زر ليقوم النظام بسحب التقييمات الجديدة تلقائياً، ومطابقتها مع أسماء موظفيك بالذكاء الاصطناعي، والرد عليها دون أي تدخل يدوي.'
                : 'Connect your official Google Business Profile with one click to automatically fetch new reviews, match them with employees via AI, and auto-reply.'}
            </p>
          </div>

          <a
            href={`/api/google/connect?companyId=${data.company.id}&returnTo=/dashboard`}
            className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-xl transition shrink-0 text-xs sm:text-sm shadow-md shadow-orange-500/20"
          >
            <Link2 className="h-4 w-4" />
            <span>
              {isGoogleConnected
                ? isAr
                  ? 'تحديث أو تغيير حساب جوجل'
                  : 'Change Google Account'
                : isAr
                ? 'ربط حساب Google Business الآن'
                : 'Connect Google Business Now'}
            </span>
          </a>
        </div>
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