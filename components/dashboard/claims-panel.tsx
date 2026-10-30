// File: components/dashboard/claims-panel.tsx
'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Check, Loader2, MapPin, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Company, ClaimStatus } from '@/lib/types/database';
import type { ClaimWithEmployee } from '@/lib/types/dashboard';
import { updateClaimStatus } from '@/app/dashboard/actions';

const STATUS_COLORS: Record<ClaimStatus, string> = {
  pending: 'border-sky-500/30 bg-sky-500/10 text-sky-600',
  matched: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  needs_review: 'border-amber-500/30 bg-amber-500/10 text-amber-600',
  rejected: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-500',
  fraud_flagged: 'border-rose-500/30 bg-rose-500/10 text-rose-600',
  expired: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-500',
};

export function ClaimsPanel({ company: _company, initialClaims }: { company: Company; initialClaims: ClaimWithEmployee[] }) {
  const { t } = useLanguage();
  const [claims, setClaims] = useState(initialClaims);
  const [isPending, startTransition] = useTransition();

  function handleDecision(claimId: string, status: 'matched' | 'rejected') {
    startTransition(async () => {
      const result = await updateClaimStatus(claimId, status);
      if (result.success) {
        setClaims((prev) => prev.map((c) => (c.id === claimId ? { ...c, status } : c)));
        toast.success(t.dashboard.claims.toastUpdated);
      } else {
        toast.error(result.error ?? t.dashboard.claims.toastError);
      }
    });
  }

  return (
    <section className="rounded-2xl border border-white/20 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60">
      <h2 className="mb-5 text-lg font-extrabold text-zinc-900 dark:text-white">{t.dashboard.claims.title}</h2>

      <div className="overflow-x-auto rounded-xl border border-zinc-200/60 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.dashboard.claims.table.employee}</TableHead>
              <TableHead>{t.dashboard.claims.table.client}</TableHead>
              <TableHead>{t.dashboard.claims.table.invoice}</TableHead>
              <TableHead>المنطقة (GPS Zone)</TableHead>
              <TableHead>{t.dashboard.claims.table.status}</TableHead>
              <TableHead>{t.dashboard.claims.table.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-zinc-500">
                  {t.dashboard.claims.empty}
                </TableCell>
              </TableRow>
            )}
            {claims.map((claim) => {
              return (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">{claim.employee_full_name ?? '—'}</TableCell>
                  <TableCell>{claim.expected_client_name ?? '—'}</TableCell>
                  <TableCell className="text-sm text-zinc-500">{claim.invoice_number ?? '—'}</TableCell>
                  <TableCell className="text-xs text-zinc-600 dark:text-zinc-300">
                    {claim.location_zone ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-1 font-medium text-orange-600 dark:text-orange-400">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {claim.location_zone}
                      </span>
                    ) : (
                      <span className="text-zinc-400">غير محدد</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[claim.status]}>
                      {t.common.statusLabels[claim.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {claim.status !== 'matched' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleDecision(claim.id, 'matched')}
                          className="h-8 gap-1 border-emerald-500/40 px-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-500 hover:text-white"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>قبول يدوي</span>
                        </Button>
                      )}
                      {claim.status !== 'rejected' && (
                        <Button
                          size="icon"
                          variant="outline"
                          disabled={isPending}
                          title="رفض"
                          onClick={() => handleDecision(claim.id, 'rejected')}
                          className="h-8 w-8 border-rose-500/40 text-rose-600 hover:bg-rose-500 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {isPending && (
        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.common.loading}
        </div>
      )}
    </section>
  );
}