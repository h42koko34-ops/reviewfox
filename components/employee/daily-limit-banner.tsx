// File: components/employee/daily-limit-banner.tsx
'use client';

import { AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/lib/i18n/language-context';

export function DailyLimitBanner({ used, max }: { used: number; max: number }) {
  const { t } = useLanguage();
  const percentage = Math.min((used / max) * 100, 100);
  const isReached = used >= max;

  return (
    <div
      className={`mb-5 rounded-2xl border p-4 ${
        isReached
          ? 'border-rose-500/30 bg-rose-500/5'
          : 'border-white/20 bg-white/60 dark:border-white/10 dark:bg-zinc-900/60'
      }`}
    >
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
          {used} / {max} {t.employee.dailyLimit.usedOf}
        </span>
        {isReached && <AlertTriangle className="h-4 w-4 text-rose-500" />}
      </div>
      <Progress value={percentage} className={isReached ? '[&>div]:bg-rose-500' : '[&>div]:bg-orange-500'} />
      {isReached && (
        <p className="mt-3 text-xs font-medium text-rose-600">
          <strong>{t.employee.dailyLimit.reachedTitle}:</strong> {t.employee.dailyLimit.reachedDesc}
        </p>
      )}
    </div>
  );
}