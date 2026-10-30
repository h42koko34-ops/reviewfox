// File: components/dashboard/employees-panel.tsx
'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/language-context';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminPermissions, Company, Profile } from '@/lib/types/database';
import { AddEmployeeModal } from './add-employee-modal';

export function EmployeesPanel({ company, initialEmployees }: { company: Company; initialEmployees: Profile[] }) {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState(initialEmployees);
  const permissions = company.admin_permissions as AdminPermissions;

  const isQuotaReached = company.current_employees_count >= company.max_employees;
  const isLocked = !permissions.can_add_employees || isQuotaReached;
  const lockReason: 'feature' | 'quota' | null = !permissions.can_add_employees
    ? 'feature'
    : isQuotaReached
      ? 'quota'
      : null;

  return (
    <section className="rounded-2xl border border-white/20 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">{t.dashboard.employees.title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {company.current_employees_count} / {company.max_employees}
          </p>
        </div>
        <AddEmployeeModal
          isLocked={isLocked}
          lockReason={lockReason}
          onCreated={(employee) => setEmployees((prev) => [employee, ...prev])}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200/60 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.dashboard.employees.table.name}</TableHead>
              <TableHead>{t.dashboard.employees.table.email}</TableHead>
              <TableHead>{t.dashboard.employees.table.points}</TableHead>
              <TableHead>{t.dashboard.employees.table.fraud}</TableHead>
              <TableHead>{t.dashboard.employees.table.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-semibold text-zinc-900 dark:text-white">{employee.full_name}</TableCell>
                <TableCell className="text-sm text-zinc-500">{employee.email}</TableCell>
                <TableCell>{employee.points}</TableCell>
                <TableCell>
                  {employee.fraud_warnings > 0 ? (
                    <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-600">
                      {employee.fraud_warnings}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      employee.is_active
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                        : 'border-zinc-400/30 bg-zinc-400/10 text-zinc-500'
                    }
                  >
                    {employee.is_active ? t.dashboard.employees.activeLabel : t.dashboard.employees.inactiveLabel}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}