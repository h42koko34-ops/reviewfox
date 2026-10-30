// File: components/super-admin/company-employees-panel.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, UserCheck, UserPlus, UserX } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Profile } from '@/lib/types/database';
import { addEmployeeToCompany, getCompanyEmployees, setEmployeeActiveStatus } from '@/app/super-admin/actions';

export function CompanyEmployeesPanel({ companyId }: { companyId: string }) {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getCompanyEmployees(companyId).then((result) => {
      if (!active) return;
      if (result.success && result.employees) setEmployees(result.employees);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [companyId]);

  function handleAddEmployee() {
    startTransition(async () => {
      const result = await addEmployeeToCompany({ companyId, ...form });
      if (result.success && result.employee) {
        setEmployees((prev) => [result.employee as Profile, ...prev]);
        setForm({ fullName: '', email: '', password: '' });
        toast.success(t.godMode.toastUpdated);
      } else {
        toast.error(result.error ?? t.godMode.toastError);
      }
    });
  }

  function handleToggleActive(employee: Profile) {
    const nextActive = !employee.is_active;
    startTransition(async () => {
      const result = await setEmployeeActiveStatus(employee.id, nextActive);
      if (result.success) {
        setEmployees((prev) =>
          prev.map((e) => (e.id === employee.id ? { ...e, is_active: nextActive } : e))
        );
        toast.success(t.godMode.toastUpdated);
      } else {
        toast.error(result.error ?? t.godMode.toastError);
      }
    });
  }

  const isValid =
    form.fullName.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 8;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-900/40 dark:bg-orange-950/20">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-orange-600 dark:text-orange-400">
          <UserPlus className="h-4 w-4" />
          {t.godMode.employees.addNew}
        </p>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t.godMode.employees.fullName}</Label>
            <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>{t.godMode.employees.email}</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t.godMode.employees.password}</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          <Button
            onClick={handleAddEmployee}
            disabled={!isValid || isPending}
            className="w-full gap-2 bg-orange-500 text-white hover:bg-orange-600"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t.godMode.employees.submit}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {!isLoading && employees.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">{t.godMode.employees.empty}</p>
        )}
        {employees.map((employee) => (
          <div
            key={employee.id}
            className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-white/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">{employee.full_name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{employee.email}</p>
              <div className="mt-1.5 flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {t.godMode.employees.pointsLabel}: {employee.points}
                </Badge>
                {employee.fraud_warnings > 0 && (
                  <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-xs text-rose-600">
                    {t.godMode.employees.fraudLabel}: {employee.fraud_warnings}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleToggleActive(employee)}
              className={employee.is_active ? 'text-rose-600' : 'text-emerald-600'}
            >
              {employee.is_active ? (
                <>
                  <UserX className="me-1.5 h-3.5 w-3.5" />
                  {t.godMode.employees.deactivate}
                </>
              ) : (
                <>
                  <UserCheck className="me-1.5 h-3.5 w-3.5" />
                  {t.godMode.employees.reactivate}
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}