// File: components/super-admin/create-company-modal.tsx
'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, MapPin, Link2, Building2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Company } from '@/lib/types/database';
import { createCompanyWithAdmin } from '@/app/super-admin/actions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (company: Company) => void;
}

const initialForm = {
  companyName: '',
  googleReviewUrl: '',
  googlePlaceId: '',
  defaultLang: 'ar' as 'ar' | 'en',
  maxEmployees: 5,
  maxDailyClaims: 5,
  adminFullName: '',
  adminEmail: '',
  adminPassword: '',
};

export function CreateCompanyModal({ open, onOpenChange, onCreated }: Props) {
  const { t, dir } = useLanguage();
  const isAr = dir === 'rtl';
  const [form, setForm] = useState(initialForm);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createCompanyWithAdmin({
        companyName: form.companyName.trim(),
        googleReviewUrl: form.googleReviewUrl.trim() || null,
        googlePlaceId: form.googlePlaceId.trim() || null,
        defaultLang: form.defaultLang,
        maxEmployees: Number(form.maxEmployees),
        maxDailyClaims: Number(form.maxDailyClaims),
        adminFullName: form.adminFullName.trim(),
        adminEmail: form.adminEmail.trim(),
        adminPassword: form.adminPassword,
      });

      if (result.success && result.company) {
        toast.success(t.createCompany.toastSuccess);
        onCreated(result.company);
        setForm(initialForm);
        onOpenChange(false);
      } else {
        toast.error(result.error ?? t.createCompany.toastError);
      }
    });
  }

  const isValid =
    form.companyName.trim().length > 1 &&
    form.adminFullName.trim().length > 1 &&
    /\S+@\S+\.\S+/.test(form.adminEmail) &&
    form.adminPassword.length >= 8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={dir}
        className="!max-w-xl !w-[95vw] max-h-[90vh] overflow-y-auto !bg-white dark:!bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl rounded-2xl"
      >
        <DialogHeader className="text-start border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-zinc-900 dark:text-white">
            <Building2 className="h-5 w-5 text-orange-500" />
            {t.createCompany.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
            {t.createCompany.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* اسم الشركة واللغة */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-2 text-start">
              <Label className="font-semibold text-zinc-800 dark:text-zinc-200">
                {t.createCompany.companyName}
              </Label>
              <Input
                value={form.companyName}
                onChange={(e) => update('companyName', e.target.value)}
                placeholder={t.createCompany.companyNamePlaceholder}
                className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
              />
            </div>

            <div className="space-y-2 text-start">
              <Label className="font-semibold text-zinc-800 dark:text-zinc-200">
                {t.createCompany.defaultLang}
              </Label>
              <Select value={form.defaultLang} onValueChange={(v) => update('defaultLang', v as 'ar' | 'en')}>
                <SelectTrigger className="w-full bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">{t.createCompany.langAr}</SelectItem>
                  <SelectItem value="en">{t.createCompany.langEn}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* الحصص والحدود اليومية في عمودين واضحين */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 text-start">
              <Label className="font-semibold text-zinc-800 dark:text-zinc-200">
                {t.createCompany.maxEmployees}
              </Label>
              <Input
                type="number"
                min={1}
                value={form.maxEmployees}
                onChange={(e) => update('maxEmployees', Number(e.target.value))}
                className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
              />
            </div>
            <div className="space-y-2 text-start">
              <Label className="font-semibold text-zinc-800 dark:text-zinc-200">
                {t.createCompany.maxDailyClaims}
              </Label>
              <Input
                type="number"
                min={1}
                value={form.maxDailyClaims}
                onChange={(e) => update('maxDailyClaims', Number(e.target.value))}
                className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
              />
            </div>
          </div>

          {/* إعدادات ربط جوجل */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
              {isAr ? 'إعدادات ربط تقييمات Google' : 'Google Reviews Connection'}
            </p>

            <div className="space-y-1.5 text-start">
              <Label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <Link2 className="h-3.5 w-3.5 text-orange-500" />
                {isAr ? 'رابط التقييم المباشر (Google Review Link)' : 'Direct Google Review URL'}
              </Label>
              <Input
                dir="ltr"
                value={form.googleReviewUrl}
                onChange={(e) => update('googleReviewUrl', e.target.value)}
                placeholder="https://g.page/r/..."
                className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
              />
            </div>

            <div className="space-y-1.5 text-start">
              <Label className="text-xs text-zinc-600 dark:text-zinc-400">
                {isAr ? 'معرّف المكان (Google Place ID - اختياري)' : 'Google Place ID (Optional)'}
              </Label>
              <Input
                dir="ltr"
                value={form.googlePlaceId}
                onChange={(e) => update('googlePlaceId', e.target.value)}
                placeholder="ChIJ..."
                className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
              />
            </div>
          </div>

          {/* بيانات مدير الشركة */}
          <div className="rounded-xl border border-orange-200 bg-orange-50/80 p-4 space-y-3 dark:border-orange-900/50 dark:bg-orange-950/30">
            <p className="text-sm font-bold text-orange-700 dark:text-orange-400 text-start">
              {t.createCompany.adminSectionTitle}
            </p>
            <div className="space-y-3 text-start">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t.createCompany.adminFullName}</Label>
                <Input
                  value={form.adminFullName}
                  onChange={(e) => update('adminFullName', e.target.value)}
                  className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{t.createCompany.adminEmail}</Label>
                  <Input
                    dir="ltr"
                    type="email"
                    value={form.adminEmail}
                    onChange={(e) => update('adminEmail', e.target.value)}
                    className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{t.createCompany.adminPassword}</Label>
                  <Input
                    dir="ltr"
                    type="password"
                    value={form.adminPassword}
                    onChange={(e) => update('adminPassword', e.target.value)}
                    className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t.createCompany.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="gap-2 bg-orange-500 text-white hover:bg-orange-600"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t.createCompany.submitting : t.createCompany.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}