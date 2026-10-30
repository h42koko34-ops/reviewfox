// File: components/dashboard/feature-showcase.tsx
'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Lock } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import type { EnabledFeatures } from '@/lib/types/database';

const FEATURE_KEYS: (keyof EnabledFeatures)[] = [
  'quick_tags',
  'voice_notes',
  'promo_codes',
  'ocr_scanner',
  'qr_gateway',
  'whatsapp_link',
  'keyword_hooks',
];

export function FeatureShowcase({ features }: { features: EnabledFeatures }) {
  const { t } = useLanguage();

  return (
    <section className="rounded-2xl border border-white/20 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60">
      <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">{t.dashboard.features.sectionTitle}</h2>
      <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">{t.dashboard.features.sectionSubtitle}</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURE_KEYS.map((key, i) => {
          const isActive = features[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`relative overflow-hidden rounded-xl border p-4 ${
                isActive
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-zinc-200/70 bg-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-800/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`font-semibold ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {t.godMode.features[key].label}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{t.godMode.features[key].desc}</p>
                </div>
                {isActive ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <Lock className="h-5 w-5 shrink-0 text-zinc-400" />
                )}
              </div>
              <span
                className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-zinc-300/50 text-zinc-500 dark:bg-zinc-700/50 dark:text-zinc-400'
                }`}
              >
                {isActive ? t.dashboard.features.activeBadge : t.dashboard.features.lockedDesc}
              </span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}