// File: components/super-admin/company-control-panel.tsx
'use client';

import { useMemo, useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Edit3, Plus, Search, ShieldCheck, ShieldOff, Settings2, Users } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Company } from '@/lib/types/database';
import { CreateCompanyModal } from './create-company-modal';
import { GodModeDrawer } from './god-mode-drawer';
import { setCompanyStatus } from '@/app/super-admin/actions';

export function CompanyControlPanel({ initialCompanies }: { initialCompanies: Company[] }) {
  const { t, dir } = useLanguage();
  const isAr = dir === 'rtl';
  const [companies, setCompanies] = useState(initialCompanies);
  const [search, setSearch] = useState('');
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [drawerTab, setDrawerTab] = useState<string>('edit');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => companies.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [companies, search]
  );

  function openCompanyDrawer(company: Company, tab: string) {
    setDrawerTab(tab);
    setActiveCompany(company);
  }

  function upsertCompany(updated: Company) {
    setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setActiveCompany((prev) => (prev && prev.id === updated.id ? updated : prev));
  }

  function handleCreated(company: Company) {
    setCompanies((prev) => [company, ...prev]);
  }

  function handleQuickToggleStatus(company: Company) {
    const nextStatus = company.status === 'active' ? 'suspended' : 'active';
    startTransition(async () => {
      const result = await setCompanyStatus(company.id, nextStatus);
      if (result.success) {
        upsertCompany({ ...company, status: nextStatus });
        toast.success(t.godMode.toastUpdated);
      } else {
        toast.error(result.error ?? t.godMode.toastError);
      }
    });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm overflow-hidden"
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between w-full">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">{t.companyPanel.title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.companyPanel.subtitle}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.companyPanel.searchPlaceholder}
              className="w-full ps-9"
            />
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-orange-500 text-white hover:bg-orange-600 shrink-0">
            <Plus className="h-4 w-4" />
            {t.companyPanel.addCompany}
          </Button>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.companyPanel.colName}</TableHead>
              <TableHead>{t.companyPanel.colStatus}</TableHead>
              <TableHead>{t.companyPanel.colEmployees}</TableHead>
              <TableHead>{t.companyPanel.colDailyLimit}</TableHead>
              <TableHead className="text-end">{t.companyPanel.colActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-zinc-500">
                  {t.companyPanel.noCompanies}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((company) => (
              <TableRow
                key={company.id}
                className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                onClick={() => openCompanyDrawer(company, 'edit')}
              >
                <TableCell className="font-semibold text-zinc-900 dark:text-white">{company.name}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      company.status === 'active'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }
                  >
                    {company.status === 'active' ? t.companyPanel.active : t.companyPanel.suspended}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                    <Users className="h-3.5 w-3.5" />
                    {company.current_employees_count} / {company.max_employees}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-zinc-600 dark:text-zinc-300">
                  {company.max_daily_claims_per_employee}
                </TableCell>
                <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCompanyDrawer(company, 'edit')}
                      className="h-8 gap-1.5 text-xs font-semibold border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-900/50 dark:text-orange-400"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      {isAr ? 'تعديل' : 'Edit'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCompanyDrawer(company, 'features')}
                      className="h-8 gap-1.5 text-xs"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      {t.companyPanel.manage}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleQuickToggleStatus(company)}
                      className="h-8 px-2"
                      title={company.status === 'active' ? t.companyPanel.suspended : t.companyPanel.active}
                    >
                      {company.status === 'active' ? (
                        <ShieldOff className="h-4 w-4 text-rose-500" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateCompanyModal open={isCreateOpen} onOpenChange={setIsCreateOpen} onCreated={handleCreated} />

      {activeCompany && (
        <GodModeDrawer
          company={activeCompany}
          open={!!activeCompany}
          initialTab={drawerTab}
          onOpenChange={(openState) => !openState && setActiveCompany(null)}
          onUpdated={upsertCompany}
        />
      )}
    </motion.section>
  );
}