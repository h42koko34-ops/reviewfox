// File: components/super-admin/god-mode-drawer.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Copy,
  Edit3,
  KeyRound,
  Link2,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Webhook,
  X,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { AdminPermissions, Company, EnabledFeatures, LangCode } from '@/lib/types/database';
import {
  setCompanyStatus,
  updateAdminPermissions,
  updateCompanyDetails,
  updateCompanyQuotas,
  updateCompanyReviewConfig,
  updateEnabledFeatures,
} from '@/app/super-admin/actions';
import { CompanyEmployeesPanel } from './company-employees-panel';

interface Props {
  company: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (company: Company) => void;
  initialTab?: string;
}

const FEATURE_KEYS: (keyof EnabledFeatures)[] = [
  'quick_tags',
  'voice_notes',
  'promo_codes',
  'ocr_scanner',
  'qr_gateway',
  'whatsapp_link',
  'keyword_hooks',
];

const PERMISSION_KEYS: (keyof AdminPermissions)[] = [
  'can_add_employees',
  'can_export_excel',
  'can_approve_needs_review',
  'can_edit_reward_amount',
  'can_view_ai_reasoning',
];

export function GodModeDrawer({
  company,
  open,
  onOpenChange,
  onUpdated,
  initialTab = 'edit',
}: Props) {
  const { t, dir } = useLanguage();
  const isAr = dir === 'rtl';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [features, setFeatures] = useState<EnabledFeatures>(company.enabled_features);
  const [permissions, setPermissions] = useState<AdminPermissions>(company.admin_permissions);

  const [companyName, setCompanyName] = useState(company.name);
  const [defaultLang, setDefaultLang] = useState<LangCode>(company.default_lang);
  const [rewardPerReview, setRewardPerReview] = useState(company.reward_per_review ?? 10);
  const [quotas, setQuotas] = useState({
    maxEmployees: company.max_employees,
    maxDailyClaims: company.max_daily_claims_per_employee,
  });

  const [googleReviewUrl, setGoogleReviewUrl] = useState(company.google_review_url ?? '');
  const [googlePlaceId, setGooglePlaceId] = useState(company.google_place_id ?? '');

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, open]);

  useEffect(() => {
    setFeatures(company.enabled_features);
    setPermissions(company.admin_permissions);
    setCompanyName(company.name);
    setDefaultLang(company.default_lang);
    setRewardPerReview(company.reward_per_review ?? 10);
    setQuotas({
      maxEmployees: company.max_employees,
      maxDailyClaims: company.max_daily_claims_per_employee,
    });
    setGoogleReviewUrl(company.google_review_url ?? '');
    setGooglePlaceId(company.google_place_id ?? '');
  }, [company]);

  if (!open) return null;

  function handleSaveCompanyDetails() {
    if (!companyName.trim()) {
      toast.error(isAr ? 'يرجى إدخال اسم الشركة' : 'Company name is required');
      return;
    }
    startTransition(async () => {
      const result = await updateCompanyDetails(company.id, {
        name: companyName,
        defaultLang,
        rewardPerReview: Number(rewardPerReview),
        maxEmployees: Number(quotas.maxEmployees),
        maxDailyClaims: Number(quotas.maxDailyClaims),
        googleReviewUrl,
        googlePlaceId,
      });

      if (result.success && result.company) {
        onUpdated(result.company);
        toast.success(isAr ? 'تم حفظ تعديلات الشركة بنجاح' : 'Company details updated successfully');
      } else {
        toast.error(result.error ?? t.godMode.toastError);
      }
    });
  }

  function handleFeatureToggle(key: keyof EnabledFeatures, value: boolean) {
    const previous = features;
    const next = { ...features, [key]: value };
    setFeatures(next);
    startTransition(async () => {
      const result = await updateEnabledFeatures(company.id, next);
      if (result.success) {
        onUpdated({ ...company, enabled_features: next });
        toast.success(t.godMode.toastUpdated);
      } else {
        setFeatures(previous);
        toast.error(result.error ?? t.godMode.toastError);
      }
    });
  }

  function handlePermissionToggle(key: keyof AdminPermissions, value: boolean) {
    const previous = permissions;
    const next = { ...permissions, [key]: value };
    setPermissions(next);
    startTransition(async () => {
      const result = await updateAdminPermissions(company.id, next);
      if (result.success) {
        onUpdated({ ...company, admin_permissions: next });
        toast.success(t.godMode.toastUpdated);
      } else {
        setPermissions(previous);
        toast.error(result.error ?? t.godMode.toastError);
      }
    });
  }

  function handleSaveQuotas() {
    startTransition(async () => {
      const result = await updateCompanyQuotas(company.id, quotas);
      if (result.success) {
        onUpdated({
          ...company,
          max_employees: quotas.maxEmployees,
          max_daily_claims_per_employee: quotas.maxDailyClaims,
        });
        toast.success(t.godMode.toastUpdated);
      } else {
        toast.error(result.error ?? t.godMode.toastError);
      }
    });
  }

  function handleSaveReviewConfig(regenerateSecret = false) {
    startTransition(async () => {
      const result = await updateCompanyReviewConfig(company.id, {
        googleReviewUrl,
        googlePlaceId,
        regenerateWebhookSecret: regenerateSecret,
      });

      if (result.success && result.company) {
        onUpdated(result.company);
        toast.success(
          isAr ? 'تم حفظ إعدادات ربط التقييمات بنجاح' : 'Review integration settings saved'
        );
      } else {
        toast.error(result.error ?? t.godMode.toastError);
      }
    });
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(isAr ? `تم نسخ ${label}` : `${label} copied to clipboard`);
  }

  function handleStatusChange(nextStatus: 'active' | 'suspended') {
    startTransition(async () => {
      const result = await setCompanyStatus(company.id, nextStatus);
      if (result.success) {
        onUpdated({ ...company, status: nextStatus });
        toast.success(t.godMode.toastUpdated);
      } else {
        toast.error(result.error ?? t.godMode.toastError);
      }
    });
  }

  const webhookEndpoint =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/reviews`
      : '/api/webhooks/reviews';

  const tabs = [
    { id: 'edit', label: isAr ? 'تعديل الشركة' : 'Edit Info' },
    { id: 'features', label: t.godMode.tabFeatures },
    { id: 'integration', label: isAr ? 'ربط جوجل' : 'Google Link' },
    { id: 'permissions', label: t.godMode.tabPermissions },
    { id: 'employees', label: t.godMode.tabEmployees },
    { id: 'danger', label: t.godMode.tabDanger },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" dir={dir}>
      {/* النقر في الخلفية يغلق النافذة */}
      <div className="fixed inset-0" onClick={() => onOpenChange(false)} />

      {/* صندوق الإعدادات العريض والعمودي 100% */}
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white dark:bg-zinc-950 shadow-2xl border-s border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* الهيدر العلوي */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 shrink-0">
          <div className="text-start">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-zinc-900 dark:text-white">
              <span>{company.name}</span>
              {isPending && <Loader2 className="h-5 w-5 animate-spin text-orange-500" />}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{t.godMode.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* شريط التبويبات الأفقي في الأعلى */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-6 py-3 shrink-0">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-2.5 py-2 text-xs font-bold transition-all text-center truncate ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* محتوى التبويبات بكامل العرض في الأسفل */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. تبويب تعديل الشركة */}
          {activeTab === 'edit' && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 space-y-4 dark:border-zinc-800 dark:bg-zinc-900 text-start w-full">
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <Edit3 className="h-4 w-4 text-orange-500" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  {isAr ? 'تعديل البيانات الأساسية للشركة' : 'Edit Basic Company Details'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">{isAr ? 'اسم الشركة' : 'Company Name'}</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-white dark:bg-zinc-950"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">{isAr ? 'اللغة الافتراضية' : 'Default Language'}</Label>
                  <Select value={defaultLang} onValueChange={(v) => setDefaultLang(v as LangCode)}>
                    <SelectTrigger className="w-full bg-white dark:bg-zinc-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">{isAr ? 'العربية' : 'Arabic'}</SelectItem>
                      <SelectItem value="en">{isAr ? 'الإنجليزية' : 'English'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">{isAr ? 'الحد الأقصى للموظفين' : 'Max Employees'}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quotas.maxEmployees}
                    onChange={(e) => setQuotas((q) => ({ ...q, maxEmployees: Number(e.target.value) }))}
                    className="bg-white dark:bg-zinc-950"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">{isAr ? 'الحد اليومي للمطالبات' : 'Max Daily Claims'}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quotas.maxDailyClaims}
                    onChange={(e) => setQuotas((q) => ({ ...q, maxDailyClaims: Number(e.target.value) }))}
                    className="bg-white dark:bg-zinc-950"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">{isAr ? 'المكافأة لكل تقييم' : 'Reward per Review'}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={rewardPerReview}
                    onChange={(e) => setRewardPerReview(Number(e.target.value))}
                    className="bg-white dark:bg-zinc-950"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="font-semibold">
                  {isAr ? 'رابط تقييمات جوجل (Google Review URL)' : 'Google Review URL'}
                </Label>
                <Input
                  dir="ltr"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://g.page/r/..."
                  className="bg-white dark:bg-zinc-950"
                />
              </div>

              <Button
                onClick={handleSaveCompanyDetails}
                disabled={isPending}
                className="w-full bg-orange-500 text-white hover:bg-orange-600 font-bold"
              >
                {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {isAr ? 'حفظ جميع التعديلات' : 'Save All Changes'}
              </Button>
            </div>
          )}

          {/* 2. تبويب الميزات */}
          {activeTab === 'features' && (
            <div className="space-y-3 w-full text-start">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{t.godMode.featuresDesc}</p>
              {FEATURE_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900 w-full"
                >
                  <div className="flex-1 text-start">
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                      {t.godMode.features[key].label}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {t.godMode.features[key].desc}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Switch
                      checked={features[key]}
                      disabled={isPending}
                      onCheckedChange={(value) => handleFeatureToggle(key, value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. تبويب ربط جوجل والـ Webhook */}
          {activeTab === 'integration' && (
            <div className="space-y-5 text-start w-full">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    {isAr ? 'بيانات صفحة التقييمات (Google Reviews)' : 'Google Reviews Page Details'}
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold">
                    <Link2 className="h-3.5 w-3.5 text-orange-500" />
                    {isAr ? 'رابط كتابة التقييم على جوجل (Google Review URL)' : 'Google Review URL'}
                  </Label>
                  <Input
                    dir="ltr"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/..."
                    className="w-full bg-white dark:bg-zinc-950"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    {isAr ? 'معرّف المكان على خرائط جوجل (Google Place ID)' : 'Google Place ID'}
                  </Label>
                  <Input
                    dir="ltr"
                    value={googlePlaceId}
                    onChange={(e) => setGooglePlaceId(e.target.value)}
                    placeholder="ChIJ..."
                    className="w-full bg-white dark:bg-zinc-950"
                  />
                </div>

                <Button
                  onClick={() => handleSaveReviewConfig(false)}
                  disabled={isPending}
                  className="w-full bg-orange-500 text-white hover:bg-orange-600"
                >
                  {isAr ? 'حفظ إعدادات رابط التقييم' : 'Save Review Link Settings'}
                </Button>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-orange-500 shrink-0" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    {isAr ? 'بيانات الربط التلقائي (Webhook & AI Matching)' : 'Webhook & AI Matching Credentials'}
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    {isAr ? 'معرّف الشركة (Company ID)' : 'Company ID'}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input dir="ltr" readOnly value={company.id} className="font-mono text-xs bg-white dark:bg-zinc-950" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(company.id, 'Company ID')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    {isAr ? 'رابط استقبال التقييمات (Webhook URL)' : 'Webhook Endpoint URL'}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input dir="ltr" readOnly value={webhookEndpoint} className="font-mono text-xs bg-white dark:bg-zinc-950" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(webhookEndpoint, 'Webhook URL')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold">
                    <KeyRound className="h-3.5 w-3.5 text-orange-500" />
                    {isAr ? 'مفتاح الأمان (Webhook Secret)' : 'Webhook Secret Key'}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      dir="ltr"
                      readOnly
                      value={company.webhook_secret ?? (isAr ? 'غير مُولّد بعد' : 'Not generated yet')}
                      className="font-mono text-xs bg-white dark:bg-zinc-950"
                    />
                    {company.webhook_secret && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(company.webhook_secret!, 'Webhook Secret')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSaveReviewConfig(true)}
                      disabled={isPending}
                      className="gap-1.5 shrink-0 text-xs"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {isAr ? 'توليد مفتاح جديد' : 'Generate Key'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. تبويب الصلاحيات */}
          {activeTab === 'permissions' && (
            <div className="space-y-3 w-full text-start">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{t.godMode.permissionsDesc}</p>
              {PERMISSION_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900 w-full"
                >
                  <div className="flex-1 text-start">
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                      {t.godMode.permissions[key].label}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {t.godMode.permissions[key].desc}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Switch
                      checked={permissions[key]}
                      disabled={isPending}
                      onCheckedChange={(value) => handlePermissionToggle(key, value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. تبويب الموظفين */}
          {activeTab === 'employees' && (
            <div className="w-full">
              <CompanyEmployeesPanel companyId={company.id} />
            </div>
          )}

          {/* 6. تبويب المنطقة الخطرة والحصص */}
          {activeTab === 'danger' && (
            <div className="space-y-6 text-start w-full">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900 w-full">
                <p className="mb-4 font-bold text-base text-zinc-900 dark:text-white">
                  {t.godMode.danger.quotasTitle}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">{t.godMode.danger.maxEmployees}</Label>
                    <Input
                      type="number"
                      min={company.current_employees_count}
                      value={quotas.maxEmployees}
                      onChange={(e) => setQuotas((q) => ({ ...q, maxEmployees: Number(e.target.value) }))}
                      className="bg-white dark:bg-zinc-950"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">{t.godMode.danger.maxDailyClaims}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={quotas.maxDailyClaims}
                      onChange={(e) => setQuotas((q) => ({ ...q, maxDailyClaims: Number(e.target.value) }))}
                      className="bg-white dark:bg-zinc-950"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveQuotas}
                  disabled={isPending}
                  className="mt-4 bg-orange-500 text-white hover:bg-orange-600 w-full sm:w-auto"
                >
                  {t.godMode.danger.saveQuotas}
                </Button>
              </div>

              <div className="rounded-xl border border-rose-300/60 bg-rose-50/70 p-5 dark:border-rose-900/40 dark:bg-rose-950/20 w-full">
                <p className="mb-1 font-bold text-base text-rose-600 dark:text-rose-400">
                  {company.status === 'active' ? t.godMode.danger.suspendTitle : t.godMode.danger.activateTitle}
                </p>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {company.status === 'active' ? t.godMode.danger.suspendDesc : t.godMode.danger.activateDesc}
                </p>

                <AlertDialog>
                  <AlertDialogTrigger
                    disabled={isPending}
                    className={
                      company.status === 'active'
                        ? 'inline-flex items-center justify-center rounded-lg border border-rose-500 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-500 hover:text-white disabled:opacity-50'
                        : 'inline-flex items-center justify-center rounded-lg border border-emerald-500 px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-500 hover:text-white disabled:opacity-50'
                    }
                  >
                    {company.status === 'active' ? (
                      <>
                        <ShieldAlert className="me-2 h-4 w-4" />
                        {t.godMode.danger.suspendAction}
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="me-2 h-4 w-4" />
                        {t.godMode.danger.activateAction}
                      </>
                    )}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.godMode.danger.confirmTitle}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {company.status === 'active' ? t.godMode.danger.suspendDesc : t.godMode.danger.activateDesc}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t.godMode.danger.confirmCancel}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleStatusChange(company.status === 'active' ? 'suspended' : 'active')}
                      >
                        {t.godMode.danger.confirmProceed}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}