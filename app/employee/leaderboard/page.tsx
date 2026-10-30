// File: app/employee/leaderboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { createClient } from '@/lib/supabase/client';
import { getLeaderboard } from '../actions';
import { LeaderboardList } from '@/components/employee/leaderboard-list';

interface Entry {
  profile_id: string;
  full_name: string | null;
  points: number;
  fraud_warnings: number;
}

export default function EmployeeLeaderboardPage() {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    Promise.all([supabase.auth.getUser(), getLeaderboard()]).then(([userResult, leaderboardResult]) => {
      if (!active) return;
      if (userResult.data.user) setCurrentUserId(userResult.data.user.id);
      if (leaderboardResult.success && leaderboardResult.entries) setEntries(leaderboardResult.entries);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <h1 className="text-lg font-extrabold text-zinc-900 dark:text-white">{t.employee.leaderboard.title}</h1>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">{t.employee.leaderboard.subtitle}</p>
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
        </div>
      ) : (
        <LeaderboardList entries={entries} currentUserId={currentUserId} />
      )}
    </div>
  );
}