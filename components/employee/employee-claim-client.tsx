// File: components/employee/employee-claim-client.tsx
'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { EnabledFeatures, PreClaim } from '@/lib/types/database';
import { NewClaimForm } from '@/components/employee/new-claim-form';
import { DailyLimitBanner } from '@/components/employee/daily-limit-banner';
import { ProfileSettingsModal } from '@/components/account/profile-settings-modal';

interface Props {
  enabledFeatures: EnabledFeatures;
  maxDailyClaims: number;
  initialTodayClaimsCount: number;
}

export function EmployeeClaimClient({
  enabledFeatures,
  maxDailyClaims,
  initialTodayClaimsCount,
}: Props) {
  const [todayClaimsCount, setTodayClaimsCount] = useState(initialTodayClaimsCount);
  const remaining = Math.max(maxDailyClaims - todayClaimsCount, 0);

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

      <DailyLimitBanner used={todayClaimsCount} max={maxDailyClaims} />

      <NewClaimForm
        enabledFeatures={enabledFeatures}
        remaining={remaining}
        onSubmitted={(claim: PreClaim) => {
          setTodayClaimsCount((prev) => prev + 1);
          void claim;
        }}
      />
    </div>
  );
}