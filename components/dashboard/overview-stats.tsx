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
    {
      label: t.dashboard.stats.totalEmployees,
      value: totalEmployees,
      icon: Users,
      color: 'from-orange-500 to-amber-500',
      shadow: 'shadow-orange-500/25',
    },
    {
      label: t.dashboard.stats.pendingClaims,
      value: pendingClaims,
      icon: ClipboardList,
      color: 'from-sky-500 to-blue-500',
      shadow: 'shadow-sky-500/25',
    },
    {
      label: t.dashboard.stats.needsReview,
      value: needsReview,
      icon: AlertTriangle,
      color: 'from-amber-500 to-yellow-500',
      shadow: 'shadow-amber-500/25',
    },
    {
      label: t.dashboard.stats.suspiciousReviews,
      value: suspiciousReviews,
      icon: ShieldAlert,
      color: 'from-rose-500 to-red-600',
      shadow: 'shadow-rose-500/25',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.35, delay: i * 0.06 }}
          className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.06] p-5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.2)] backdrop-blur-2xl"
        >
          {/* توهج لوني ناعم خلف الزجاج */}
          <div
            className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${card.color} opacity-25 blur-2xl`}
          />

          <div
            className={`mb-3.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-lg ${card.shadow}`}
          >
            <card.icon className="h-5 w-5" />
          </div>

          <p className="text-xs font-semibold text-zinc-300/80">{card.label}</p>
          <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {card.value.toLocaleString()}
          </p>
        </motion.div>
      ))}
    </div>
  );
}