// File: app/employee/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import type { EnabledFeatures, PreClaim } from '@/lib/types/database';
import { getEmployeeBundle } from './actions';
import { NewClaimForm } from '@/components/employee/new-claim-form';
import { DailyLimitBanner } from '@/components/employee/daily-limit-banner';
import { ProfileSettingsModal } from '@/components/account/profile-settings-modal';

export default function EmployeeNewClaimPage() {
  const [data, setData] = useState<{
    enabledFeatures: EnabledFeatures;
    maxDailyClaims: number;
    todayClaimsCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getEmployeeBundle().then((result) => {
      if (!active) return;
      if (result.success && result.enabledFeatures) {
        setData({
          enabledFeatures: result.enabledFeatures,
          maxDailyClaims: result.maxDailyClaims ?? 5,
          todayClaimsCount: result.todayClaimsCount ?? 0,
        });
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  const remaining = Math.max(data.maxDailyClaims - data.todayClaimsCount, 0);

  return (
    <div className="space-y-4">
      {/* شريط علوي للوصول السريع لإعدادات حساب الفني */}
      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
          <Sparkles className="h-4 w-4 text-orange-500 shrink-0" />
          <span>بوابة الفني الذكية</span>
        </div>
        <ProfileSettingsModal />
      </div>

      <DailyLimitBanner used={data.todayClaimsCount} max={data.maxDailyClaims} />

      <NewClaimForm
        enabledFeatures={data.enabledFeatures}
        remaining={remaining}
        onSubmitted={(claim: PreClaim) => {
          setData((prev) =>
            prev
              ? { ...prev, todayClaimsCount: prev.todayClaimsCount + 1 }
              : prev
          );
          void claim;
        }}
      />
    </div>
  );
}