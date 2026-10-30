// File: components/employee/claims-history-list.tsx
'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/language-context';
import { Badge } from '@/components/ui/badge';
import type { ClaimStatus, PreClaim } from '@/lib/types/database';

const STATUS_COLORS: Record<ClaimStatus, string> = {
  pending: 'border-sky-500/30 bg-sky-500/10 text-sky-600',
  matched: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  needs_review: 'border-amber-500/30 bg-amber-500/10 text-amber-600',
  rejected: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-500',
  fraud_flagged: 'border-rose-500/30 bg-rose-500/10 text-rose-600',
  expired: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-500',
};

export function ClaimsHistoryList({ claims }: { claims: PreClaim[] }) {
  const { t } = useLanguage();

  if (claims.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/50 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
        {t.employee.history.empty}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {claims.map((claim, i) => (
        <motion.div
          key={claim.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: i * 0.03 }}
          className="rounded-xl border border-white/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60"
        >
          <div className="mb-1.5 flex items-center justify-between">
            <p className="font-semibold text-zinc-900 dark:text-white">{claim.expected_client_name}</p>
            <Badge variant="outline" className={STATUS_COLORS[claim.status]}>
              {t.common.statusLabels[claim.status]}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t.employee.history.invoiceLabel}: {claim.invoice_number} ·{' '}
            {new Date(claim.created_at).toLocaleDateString()}
          </p>
        </motion.div>
      ))}
    </div>
  );
}