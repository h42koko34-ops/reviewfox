// File: components/employee/leaderboard-list.tsx
'use client';

import { motion } from 'framer-motion';
import { Crown, Medal } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

interface Entry {
  profile_id: string;
  full_name: string | null;
  points: number;
  fraud_warnings: number;
}

export function LeaderboardList({ entries, currentUserId }: { entries: Entry[]; currentUserId: string }) {
  const { t } = useLanguage();

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/50 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
        {t.employee.leaderboard.empty}
      </div>
    );
  }

  const medalColors = ['text-amber-400', 'text-zinc-400', 'text-orange-700'];

  return (
    <div className="space-y-2.5">
      {entries.map((entry, i) => {
        const isCurrentUser = entry.profile_id === currentUserId;
        return (
          <motion.div
            key={entry.profile_id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className={`flex items-center justify-between rounded-xl border p-3.5 ${
              isCurrentUser
                ? 'border-orange-500/40 bg-orange-500/5'
                : 'border-white/20 bg-white/60 dark:border-white/10 dark:bg-zinc-900/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-extrabold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {i < 3 ? (
                  i === 0 ? (
                    <Crown className={`h-4 w-4 ${medalColors[i]}`} />
                  ) : (
                    <Medal className={`h-4 w-4 ${medalColors[i]}`} />
                  )
                ) : (
                  i + 1
                )}
              </div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {entry.full_name}
                {isCurrentUser && <span className="ms-1.5 text-xs text-orange-500">({t.employee.leaderboard.you})</span>}
              </p>
            </div>
            <span className="text-sm font-extrabold text-orange-500">
              {entry.points} {t.employee.leaderboard.pointsLabel}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}