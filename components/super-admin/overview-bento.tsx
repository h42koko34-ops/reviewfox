// File: components/super-admin/overview-bento.tsx
'use client';

import { motion } from 'framer-motion';
import { Building2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

interface OverviewStats {
  activeCompanies: number;
  reviewsMatched: number;
  fraudBlocked: number;
}

export function OverviewBento({ stats }: { stats: OverviewStats }) {
  const { t } = useLanguage();

  const cards = [
    {
      label: t.overview.activeCompanies,
      value: stats.activeCompanies,
      icon: Building2,
      color: 'from-orange-500 to-amber-500',
    },
    {
      label: t.overview.reviewsMatched,
      value: stats.reviewsMatched,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      label: t.overview.fraudBlocked,
      value: stats.fraudBlocked,
      icon: ShieldAlert,
      color: 'from-rose-500 to-red-600',
    },
  ];

  return (
    <div className="w-full space-y-4">
      <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white">
        {t.overview.sectionTitle}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm w-full"
          >
            <div
              className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${card.color} opacity-20 blur-2xl pointer-events-none`}
            />
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-white shadow-md`}
            >
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 truncate">
              {card.label}
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
              {card.value.toLocaleString()}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}