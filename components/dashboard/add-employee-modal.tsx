// File: components/dashboard/add-employee-modal.tsx
'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Lock, UserPlus } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Profile } from '@/lib/types/database';
import { addEmployeeAsCompanyAdmin } from '@/app/dashboard/actions';

interface Props {
  isLocked: boolean;
  lockReason: 'feature' | 'quota' | null;
  onCreated: (employee: Profile) => void;
}

export function AddEmployeeModal({ isLocked, lockReason, onCreated }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await addEmployeeAsCompanyAdmin(form);
      if (result.success && result.employee) {
        toast.success(t.dashboard.employees.addModal.toastSuccess);
        onCreated(result.employee);
        setForm({ fullName: '', email: '', password: '' });
        setOpen(false);
      } else if (result.error === 'LOCKED_FEATURE' || result.error === 'QUOTA_REACHED') {
        toast.error(t.dashboard.employees.lockedTooltip);
      } else {
        toast.error(result.error ?? t.dashboard.employees.addModal.toastError);
      }
    });
  }

  const isValid =
    form.fullName.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 8;

  if (isLocked) {
    const tooltipText =
      lockReason === 'quota' ? t.dashboard.employees.quotaReachedTooltip : t.dashboard.employees.lockedTooltip;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
            <Button disabled className="gap-2 opacity-60">
              <Lock className="h-4 w-4" />
              {t.dashboard.employees.addButton}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-center">{tooltipText}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-orange-500 text-white hover:bg-orange-600">
          <UserPlus className="h-4 w-4" />
          {t.dashboard.employees.addButton}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.dashboard.employees.addModal.title}</DialogTitle>
          <DialogDescription>{t.dashboard.employees.addModal.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t.dashboard.employees.addModal.fullName}</Label>
            <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>{t.dashboard.employees.addModal.email}</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>{t.dashboard.employees.addModal.password}</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending} className="gap-2 bg-orange-500 text-white hover:bg-orange-600">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t.dashboard.employees.addModal.submitting : t.dashboard.employees.addModal.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}