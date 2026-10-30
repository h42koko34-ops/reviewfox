// File: components/dashboard/payroll-panel.tsx
'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Download, Loader2, Lock } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminPermissions, Company, PreClaim, Profile } from '@/lib/types/database';
import { generatePayrollReport, updateRewardAmount } from '@/app/dashboard/actions';

function downloadBase64File(base64: string, filename: string) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function PayrollPanel({
  company,
  employees,
  matchedClaims,
}: {
  company: Company;
  employees: Profile[];
  matchedClaims: PreClaim[];
}) {
  const { t } = useLanguage();
  const permissions = company.admin_permissions as AdminPermissions;
  const [rewardAmount, setRewardAmount] = useState(company.reward_per_review);
  const [isSaving, startSaving] = useTransition();
  const [isExporting, startExporting] = useTransition();

  const rows = useMemo(() => {
    const now = new Date();
    const monthMatches = matchedClaims.filter((c) => {
      const date = new Date(c.created_at);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });

    const counts = new Map<string, number>();
    monthMatches.forEach((c) => counts.set(c.employee_id, (counts.get(c.employee_id) ?? 0) + 1));

    return employees.map((e) => {
      const matchedCount = counts.get(e.id) ?? 0;
      return { id: e.id, fullName: e.full_name ?? '—', matchedCount, totalReward: matchedCount * rewardAmount };
    });
  }, [employees, matchedClaims, rewardAmount]);

  const grandTotal = rows.reduce((sum, r) => sum + r.totalReward, 0);

  function handleSaveReward() {
    startSaving(async () => {
      const result = await updateRewardAmount(rewardAmount);
      if (result.success) {
        toast.success(t.common.saving);
      } else if (result.error === 'LOCKED_FEATURE') {
        toast.error(t.dashboard.payroll.rewardLocked);
        setRewardAmount(company.reward_per_review);
      } else {
        toast.error(result.error ?? t.godMode.toastError);
      }
    });
  }

  function handleExport() {
    startExporting(async () => {
      const result = await generatePayrollReport();
      if (result.success && result.base64 && result.filename) {
        downloadBase64File(result.base64, result.filename);
        toast.success(t.dashboard.excelExport.toastSuccess);
      } else if (result.error === 'LOCKED_FEATURE') {
        toast.error(t.dashboard.excelExport.lockedTooltip);
      } else {
        toast.error(result.error ?? t.dashboard.excelExport.toastError);
      }
    });
  }

  return (
    <section className="rounded-2xl border border-white/20 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">{t.dashboard.payroll.title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.dashboard.payroll.subtitle}</p>
        </div>

        {permissions.can_export_excel ? (
          <Button onClick={handleExport} disabled={isExporting} className="gap-2 bg-orange-500 text-white hover:bg-orange-600">
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isExporting ? t.dashboard.excelExport.generating : t.dashboard.excelExport.button}
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Button disabled className="gap-2 opacity-60">
                  <Lock className="h-4 w-4" />
                  {t.dashboard.excelExport.button}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-center">{t.dashboard.excelExport.lockedTooltip}</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200/70 bg-white/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {t.dashboard.payroll.rewardPerReview}
          </label>
          <Input
            type="number"
            step="0.01"
            min={0}
            disabled={!permissions.can_edit_reward_amount}
            value={rewardAmount}
            onChange={(e) => setRewardAmount(Number(e.target.value))}
            className="w-40"
          />
        </div>
        {permissions.can_edit_reward_amount ? (
          <Button size="sm" onClick={handleSaveReward} disabled={isSaving} className="bg-orange-500 text-white hover:bg-orange-600">
            {isSaving && <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" />}
            {t.dashboard.payroll.saveReward}
          </Button>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <Lock className="h-3.5 w-3.5" />
            {t.dashboard.payroll.rewardLocked}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200/60 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.dashboard.payroll.employeeCol}</TableHead>
              <TableHead>{t.dashboard.payroll.matchedCol}</TableHead>
              <TableHead>{t.dashboard.payroll.totalCol}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.fullName}</TableCell>
                <TableCell>{row.matchedCount}</TableCell>
                <TableCell className="font-semibold text-orange-600">{row.totalReward.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-extrabold">{t.dashboard.payroll.grandTotal}</TableCell>
              <TableCell />
              <TableCell className="font-extrabold text-orange-600">{grandTotal.toFixed(2)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
}