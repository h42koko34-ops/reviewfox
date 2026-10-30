// File: components/dashboard/overview-stats.tsx
'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ClipboardList, ShieldAlert, Users } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

interface Props {
  totalEmployees: number;
  pendingClaims: number;
  needsReview: number;
  suspiciousReviews: number;
}

export function OverviewStats({ totalEmployees, pendingClaims, needsReview, suspiciousReviews }: Props) {
  const { t } = useLanguage();

  const cards = [
    { label: t.dashboard.stats.totalEmployees, value: totalEmployees, icon: Users, color: 'from-orange-500 to-amber-500' },
    { label: t.dashboard.stats.pendingClaims, value: pendingClaims, icon: ClipboardList, color: 'from-sky-500 to-blue-500' },
    { label: t.dashboard.stats.needsReview, value: needsReview, icon: AlertTriangle, color: 'from-amber-500 to-yellow-500' },
    { label: t.dashboard.stats.suspiciousReviews, value: suspiciousReviews, icon: ShieldAlert, color: 'from-rose-500 to-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.07 }}
          className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/60 p-5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60"
        >
          <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${card.color} opacity-20 blur-2xl`} />
          <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg`}>
            <card.icon className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{card.label}</p>
          <p className="mt-1 text-2xl font-extrabold text-zinc-900 dark:text-white">{card.value.toLocaleString()}</p>
        </motion.div>
      ))}
    </div>
  );
}