// File: components/super-admin/create-company-modal.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Loader2, MapPin, Link2, Building2, Plus, Trash2, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Company } from '@/lib/types/database';
import { createCompanyWithAdmin } from '@/app/super-admin/actions';
import type { BranchItem } from './god-mode-drawer';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (company: Company) => void;
}

const initialForm = {
  companyName: '',
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
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [branches, setBranches] = useState<BranchItem[]>([
    { name: 'الفرع الرئيسي', reviewUrl: '', placeId: '' },
  ]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  function update<K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addBranch() {
    setBranches((prev) => [
      ...prev,
      { name: isAr ? `فرع ${prev.length + 1}` : `Branch ${prev.length + 1}`, reviewUrl: '', placeId: '' },
    ]);
  }

  function removeBranch(index: number) {
    setBranches((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function updateBranch(index: number, field: keyof BranchItem, value: string) {
    setBranches((prev) => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  }

  function handleSubmit() {
    const cleaned = branches
      .map((b, idx) => ({
        name: b.name.trim() || (idx === 0 ? 'الفرع الرئيسي' : `فرع ${idx + 1}`),
        reviewUrl: b.reviewUrl.trim(),
        placeId: b.placeId.trim(),
      }))
      .filter((b) => b.reviewUrl !== '' || b.placeId !== '');

    let googleReviewUrl: string | null = null;
    let googlePlaceId: string | null = null;

    if (cleaned.length === 1 && cleaned[0].name === 'الفرع الرئيسي') {
      googleReviewUrl = cleaned[0].reviewUrl || null;
      googlePlaceId = cleaned[0].placeId || null;
    } else if (cleaned.length > 0) {
      googleReviewUrl = cleaned.map((b) => b.reviewUrl).filter(Boolean).join(' || ') || null;
      googlePlaceId = JSON.stringify(cleaned);
    }

    startTransition(async () => {
      const result = await createCompanyWithAdmin({
        companyName: form.companyName.trim(),
        googleReviewUrl,
        googlePlaceId,
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
        setBranches([{ name: 'الفرع الرئيسي', reviewUrl: '', placeId: '' }]);
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

  return createPortal(
    <div
      dir={dir}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
      onClick={() => onOpenChange(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/15 bg-zinc-950 p-6 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="text-start">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
              <Building2 className="h-5 w-5 text-orange-500" />
              {t.createCompany.title}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">{t.createCompany.description}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 py-4">
          {/* اسم الشركة واللغة */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-2 text-start">
              <Label className="font-semibold text-zinc-200">{t.createCompany.companyName}</Label>
              <Input
                value={form.companyName}
                onChange={(e) => update('companyName', e.target.value)}
                placeholder={t.createCompany.companyNamePlaceholder}
                className="bg-zinc-900 border-white/15 text-white"
              />
            </div>

            <div className="space-y-2 text-start">
              <Label className="font-semibold text-zinc-200">{t.createCompany.defaultLang}</Label>
              <Select value={form.defaultLang} onValueChange={(v) => update('defaultLang', v as 'ar' | 'en')}>
                <SelectTrigger className="w-full bg-zinc-900 border-white/15 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">{t.createCompany.langAr}</SelectItem>
                  <SelectItem value="en">{t.createCompany.langEn}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* الحصص والحدود اليومية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 text-start">
              <Label className="font-semibold text-zinc-200">{t.createCompany.maxEmployees}</Label>
              <Input
                type="number"
                min={1}
                value={form.maxEmployees}
                onChange={(e) => update('maxEmployees', Number(e.target.value))}
                className="bg-zinc-900 border-white/15 text-white"
              />
            </div>
            <div className="space-y-2 text-start">
              <Label className="font-semibold text-zinc-200">{t.createCompany.maxDailyClaims}</Label>
              <Input
                type="number"
                min={1}
                value={form.maxDailyClaims}
                onChange={(e) => update('maxDailyClaims', Number(e.target.value))}
                className="bg-zinc-900 border-white/15 text-white"
              />
            </div>
          </div>

          {/* إعدادات فروع Google Maps المتعددة */}
          <div className="rounded-2xl border border-white/15 bg-zinc-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
                <span>{isAr ? `فروع الشركة على Google (${branches.length})` : `Google Branches (${branches.length})`}</span>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBranch}
                className="h-8 gap-1.5 rounded-xl border-orange-500/40 bg-orange-500/10 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{isAr ? 'إضافة فرع آخر' : 'Add Branch'}</span>
              </Button>
            </div>

            <div className="space-y-3">
              {branches.map((branch, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2.5 text-start"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={branch.name}
                      onChange={(e) => updateBranch(idx, 'name', e.target.value)}
                      placeholder={isAr ? 'اسم الفرع (مثال: فرع التجمع)' : 'Branch Name'}
                      className="h-9 text-xs font-bold bg-zinc-900 border-white/15 text-white"
                    />
                    {branches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBranch(idx)}
                        className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/20 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <Link2 className="h-3 w-3 text-orange-500" />
                      {isAr ? 'رابط التقييم المباشر (Google Review Link)' : 'Direct Google Review URL'}
                    </Label>
                    <Input
                      dir="ltr"
                      value={branch.reviewUrl}
                      onChange={(e) => updateBranch(idx, 'reviewUrl', e.target.value)}
                      placeholder="https://g.page/r/..."
                      className="h-9 text-xs bg-zinc-900 border-white/15 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-zinc-400">
                      {isAr ? 'معرّف المكان (Google Place ID - اختياري)' : 'Google Place ID (Optional)'}
                    </Label>
                    <Input
                      dir="ltr"
                      value={branch.placeId}
                      onChange={(e) => updateBranch(idx, 'placeId', e.target.value)}
                      placeholder="ChIJ..."
                      className="h-9 text-xs bg-zinc-900 border-white/15 text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* بيانات مدير الشركة */}
          <div className="rounded-2xl border border-orange-500/30 bg-orange-950/20 p-4 space-y-3">
            <p className="text-sm font-bold text-orange-400 text-start">
              {t.createCompany.adminSectionTitle}
            </p>
            <div className="space-y-3 text-start">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-200">{t.createCompany.adminFullName}</Label>
                <Input
                  value={form.adminFullName}
                  onChange={(e) => update('adminFullName', e.target.value)}
                  className="bg-zinc-900 border-white/15 text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-200">{t.createCompany.adminEmail}</Label>
                  <Input
                    dir="ltr"
                    type="email"
                    value={form.adminEmail}
                    onChange={(e) => update('adminEmail', e.target.value)}
                    className="bg-zinc-900 border-white/15 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-200">{t.createCompany.adminPassword}</Label>
                  <Input
                    dir="ltr"
                    type="password"
                    value={form.adminPassword}
                    onChange={(e) => update('adminPassword', e.target.value)}
                    className="bg-zinc-900 border-white/15 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t.createCompany.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="gap-2 bg-orange-500 text-white hover:bg-orange-600 font-bold"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t.createCompany.submitting : t.createCompany.submit}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}