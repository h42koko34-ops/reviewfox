// File: app/employee/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import type { PreClaim } from '@/lib/types/database';
import { getMyClaims } from '../actions';
import { ClaimsHistoryList } from '@/components/employee/claims-history-list';

export default function EmployeeHistoryPage() {
  const { t } = useLanguage();
  const [claims, setClaims] = useState<PreClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMyClaims().then((result) => {
      if (!active) return;
      if (result.success && result.claims) setClaims(result.claims);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-lg font-extrabold text-zinc-900 dark:text-white">{t.employee.history.title}</h1>
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
        </div>
      ) : (
        <ClaimsHistoryList claims={claims} />
      )}
    </div>
  );
}