// File: components/super-admin/god-mode-drawer.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Copy,
  Edit3,
  KeyRound,
  Link2,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
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
  company: Company & {
    google_connected_email?: string | null;
    google_refresh_token?: string | null;
    google_connected_at?: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (company: Company) => void;
  initialTab?: string;
}

export interface BranchItem {
  name: string;
  reviewUrl: string;
  placeId: string;
}

// دوال مساعدة لتحويل واسترجاع الفروع المتعددة بدون الحاجة لتغيير هيكل جدول Supabase
function parseBranches(rawUrl?: string | null, rawPlaceId?: string | null): BranchItem[] {
  if (!rawUrl && !rawPlaceId) {
    return [{ name: 'الفرع الرئيسي', reviewUrl: '', placeId: '' }];
  }

  try {
    if (rawPlaceId && rawPlaceId.trim().startsWith('[')) {
      const parsed = JSON.parse(rawPlaceId) as BranchItem[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((b, idx) => ({
          name: b.name || `فرع ${idx + 1}`,
          reviewUrl: b.reviewUrl || '',
          placeId: b.placeId || '',
        }));
      }
    }
  } catch {
    // Fallback to standard single/delimited parsing
  }

  const urls = (rawUrl ?? '').split(' || ').map((s) => s.trim());
  const places = (rawPlaceId ?? '').split(' || ').map((s) => s.trim());
  const count = Math.max(urls.length, places.length, 1);

  return Array.from({ length: count }, (_, i) => ({
    name: i === 0 ? 'الفرع الرئيسي' : `فرع ${i + 1}`,
    reviewUrl: urls[i] ?? '',
    placeId: places[i] ?? '',
  }));
}

function serializeBranches(branches: BranchItem[]): {
  googleReviewUrl: string | null;
  googlePlaceId: string | null;
} {
  const cleaned = branches
    .map((b, idx) => ({
      name: b.name.trim() || (idx === 0 ? 'الفرع الرئيسي' : `فرع ${idx + 1}`),
      reviewUrl: b.reviewUrl.trim(),
      placeId: b.placeId.trim(),
    }))
    .filter((b) => b.reviewUrl !== '' || b.placeId !== '');

  if (cleaned.length === 0) {
    return { googleReviewUrl: null, googlePlaceId: null };
  }

  if (cleaned.length === 1 && cleaned[0].name === 'الفرع الرئيسي') {
    return {
      googleReviewUrl: cleaned[0].reviewUrl || null,
      googlePlaceId: cleaned[0].placeId || null,
    };
  }

  // نحفظ الرابط الأول أو جميع الروابط مفصولة في google_review_url، ومصفوفة الفروع الكاملة في google_place_id
  return {
    googleReviewUrl: cleaned.map((b) => b.reviewUrl).filter(Boolean).join(' || ') || null,
    googlePlaceId: JSON.stringify(cleaned),
  };
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

  const [mounted, setMounted] = useState(false);
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

  const [branches, setBranches] = useState<BranchItem[]>(() =>
    parseBranches(company.google_review_url, company.google_place_id)
  );

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

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
    setBranches(parseBranches(company.google_review_url, company.google_place_id));
  }, [company]);

  if (!open || !mounted) return null;

  const connectedEmail = company.google_connected_email;
  const isGoogleConnected = Boolean(connectedEmail || company.google_refresh_token);

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

  function handleSaveCompanyDetails() {
    if (!companyName.trim()) {
      toast.error(isAr ? 'يرجى إدخال اسم الشركة' : 'Company name is required');
      return;
    }

    const { googleReviewUrl, googlePlaceId } = serializeBranches(branches);

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
        toast.success(isAr ? 'تم حفظ تعديلات الشركة والفروع بنجاح' : 'Company & branches updated');
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
    const { googleReviewUrl, googlePlaceId } = serializeBranches(branches);

    startTransition(async () => {
      const result = await updateCompanyReviewConfig(company.id, {
        googleReviewUrl,
        googlePlaceId,
        regenerateWebhookSecret: regenerateSecret,
      });

      if (result.success && result.company) {
        onUpdated(result.company);
        toast.success(
          isAr ? 'تم حفظ إعدادات فروع Google بنجاح' : 'Google branches integration saved'
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
    { id: 'integration', label: isAr ? 'فروع جوجل' : 'Branches' },
    { id: 'permissions', label: t.godMode.tabPermissions },
    { id: 'employees', label: t.godMode.tabEmployees },
    { id: 'danger', label: t.godMode.tabDanger },
  ];

  // قسم الربط التلقائي عبر Google OAuth 2.0
  const renderGoogleOAuthSection = () => (
    <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-zinc-900 to-zinc-950 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-400 shrink-0" />
          <span className="text-sm font-bold text-white">
            {isAr
              ? 'الربط التلقائي بالذكاء الاصطناعي (Google Business OAuth)'
              : 'Google Business AI Auto-Connect (OAuth)'}
          </span>
        </div>

        {isGoogleConnected ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{connectedEmail ? `${isAr ? 'متصل:' : 'Connected:'} ${connectedEmail}` : isAr ? 'متصل بنجاح' : 'Connected'}</span>
          </span>
        ) : (
          <span className="text-xs font-semibold bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-lg">
            {isAr ? 'غير متصل بعد' : 'Not connected'}
          </span>
        )}
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">
        {isAr
          ? 'اربط حساب Google Business الرسمي الخاص بالشركة بضغطة زر واحدة ليقوم النظام بسحب التقييمات الجديدة ومطابقتها بالذكاء الاصطناعي وإضافة المكافآت للموظفين تلقائياً بدون أي تدخل يدوي.'
          : 'Connect the official Google Business Profile with one click to automatically fetch new reviews, match them with AI, and reward employees.'}
      </p>

      <a
        href={`/api/google/connect?companyId=${company.id}`}
        className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-xl transition w-full text-center text-xs sm:text-sm shadow-lg shadow-orange-500/20"
      >
        <Link2 className="h-4 w-4" />
        <span>
          {isGoogleConnected
            ? isAr
              ? 'تحديث أو تغيير حساب Google Business المربوط'
              : 'Reconnect / Change Google Business Account'
            : isAr
            ? 'ربط حساب Google Business تلقائياً'
            : 'Connect Google Business Automatically'}
        </span>
      </a>
    </div>
  );

  const renderBranchesManager = () => (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <Label className="font-bold text-sm flex items-center gap-1.5 text-white">
          <MapPin className="h-4 w-4 text-orange-500" />
          <span>{isAr ? `فروع الشركة على Google Maps (${branches.length})` : `Google Maps Branches (${branches.length})`}</span>
        </Label>
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
            className="rounded-2xl border border-white/15 bg-black/40 p-3.5 space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <Input
                value={branch.name}
                onChange={(e) => updateBranch(idx, 'name', e.target.value)}
                placeholder={isAr ? `اسم الفرع (مثال: فرع مدينة نصر)` : `Branch Name`}
                className="h-9 text-xs font-bold bg-zinc-900 border-white/15 text-white"
              />
              {branches.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBranch(idx)}
                  className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/20 transition shrink-0"
                  title={isAr ? 'حذف الفرع' : 'Remove branch'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-[11px] text-zinc-400">
                <Link2 className="h-3 w-3 text-orange-500" />
                <span>{isAr ? 'رابط التقييم على جوجل ماب (Google Review URL)' : 'Google Review URL'}</span>
              </Label>
              <Input
                dir="ltr"
                value={branch.reviewUrl}
                onChange={(e) => updateBranch(idx, 'reviewUrl', e.target.value)}
                placeholder="https://g.page/r/..."
                className="h-9 text-xs bg-zinc-900 border-white/15 text-white"
              />
            </div>

            <div className="space-y-1.5">
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
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end bg-black/75 backdrop-blur-md" dir={dir}>
      {/* النقر في الخلفية يغلق النافذة */}
      <div className="fixed inset-0" onClick={() => onOpenChange(false)} />

      {/* صندوق الإعدادات بملء الشاشة على الهاتف وبعرض 2xl على الكمبيوتر */}
      <div className="relative z-10 flex h-[100dvh] w-full max-w-2xl flex-col bg-zinc-950 text-white shadow-2xl border-s border-white/15 overflow-hidden">
        {/* الهيدر العلوي */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0 bg-zinc-900/80">
          <div className="text-start">
            <h2 className="flex items-center gap-2 text-lg sm:text-xl font-extrabold text-white">
              <span>{company.name}</span>
              {isPending && <Loader2 className="h-5 w-5 animate-spin text-orange-500" />}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">{t.godMode.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* شريط التبويبات الأفقي في الأعلى */}
        <div className="border-b border-white/10 bg-zinc-900/50 px-4 py-3 shrink-0">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-2.5 py-2 text-xs font-bold transition-all text-center truncate ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* محتوى التبويبات بكامل العرض مع تمرير سلس على الموبايل */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 1. تبويب تعديل الشركة */}
          {activeTab === 'edit' && (
            <div className="rounded-2xl border border-white/15 bg-zinc-900/70 p-4 sm:p-5 space-y-4 text-start w-full">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Edit3 className="h-4 w-4 text-orange-500" />
                <h3 className="font-bold text-base text-white">
                  {isAr ? 'تعديل البيانات الأساسية والفروع' : 'Edit Company & Branches'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold text-zinc-200">{isAr ? 'اسم الشركة' : 'Company Name'}</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-zinc-950 border-white/15 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-zinc-200">{isAr ? 'اللغة الافتراضية' : 'Default Language'}</Label>
                  <Select value={defaultLang} onValueChange={(v) => setDefaultLang(v as LangCode)}>
                    <SelectTrigger className="w-full bg-zinc-950 border-white/15 text-white">
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
                  <Label className="font-semibold text-zinc-200">{isAr ? 'الحد الأقصى للموظفين' : 'Max Employees'}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quotas.maxEmployees}
                    onChange={(e) => setQuotas((q) => ({ ...q, maxEmployees: Number(e.target.value) }))}
                    className="bg-zinc-950 border-white/15 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-zinc-200">{isAr ? 'الحد اليومي للمطالبات' : 'Max Daily Claims'}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quotas.maxDailyClaims}
                    onChange={(e) => setQuotas((q) => ({ ...q, maxDailyClaims: Number(e.target.value) }))}
                    className="bg-zinc-950 border-white/15 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-zinc-200">{isAr ? 'المكافأة لكل تقييم' : 'Reward per Review'}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={rewardPerReview}
                    onChange={(e) => setRewardPerReview(Number(e.target.value))}
                    className="bg-zinc-950 border-white/15 text-white"
                  />
                </div>
              </div>

              {/* قسم الربط التلقائي مع Google Business OAuth */}
              {renderGoogleOAuthSection()}

              {/* قسم الفروع المتعددة */}
              {renderBranchesManager()}

              <Button
                onClick={handleSaveCompanyDetails}
                disabled={isPending}
                className="w-full bg-orange-500 text-white hover:bg-orange-600 font-bold py-3 rounded-xl"
              >
                {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {isAr ? 'حفظ جميع التعديلات والفروع' : 'Save All Changes & Branches'}
              </Button>
            </div>
          )}

          {/* 2. تبويب الميزات */}
          {activeTab === 'features' && (
            <div className="space-y-3 w-full text-start">
              <p className="text-sm text-zinc-400 mb-3">{t.godMode.featuresDesc}</p>
              {FEATURE_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/15 bg-zinc-900/70 p-4 w-full"
                >
                  <div className="flex-1 text-start">
                    <div className="text-sm font-bold text-white mb-1">
                      {t.godMode.features[key].label}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
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

          {/* 3. تبويب ربط فروع جوجل والـ Webhook */}
          {activeTab === 'integration' && (
            <div className="space-y-5 text-start w-full">
              {/* قسم الربط التلقائي مع Google Business OAuth */}
              {renderGoogleOAuthSection()}

              <div className="rounded-2xl border border-white/15 bg-zinc-900/70 p-4 space-y-4">
                {renderBranchesManager()}

                <Button
                  onClick={() => handleSaveReviewConfig(false)}
                  disabled={isPending}
                  className="w-full bg-orange-500 text-white hover:bg-orange-600 font-bold rounded-xl"
                >
                  {isAr ? 'حفظ إعدادات فروع التقييم' : 'Save Branches Settings'}
                </Button>
              </div>

              <div className="rounded-2xl border border-white/15 bg-zinc-900/70 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-orange-500 shrink-0" />
                  <h3 className="font-bold text-sm text-white">
                    {isAr ? 'بيانات الربط التلقائي (Webhook & AI Matching)' : 'Webhook & AI Matching Credentials'}
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-zinc-300">
                    {isAr ? 'معرّف الشركة (Company ID)' : 'Company ID'}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input dir="ltr" readOnly value={company.id} className="font-mono text-xs bg-zinc-950 border-white/15" />
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
                  <Label className="text-xs font-semibold text-zinc-300">
                    {isAr ? 'رابط استقبال التقييمات (Webhook URL)' : 'Webhook Endpoint URL'}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input dir="ltr" readOnly value={webhookEndpoint} className="font-mono text-xs bg-zinc-950 border-white/15" />
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
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                    <KeyRound className="h-3.5 w-3.5 text-orange-500" />
                    {isAr ? 'مفتاح الأمان (Webhook Secret)' : 'Webhook Secret Key'}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      dir="ltr"
                      readOnly
                      value={company.webhook_secret ?? (isAr ? 'غير مُولّد بعد' : 'Not generated yet')}
                      className="font-mono text-xs bg-zinc-950 border-white/15"
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
              <p className="text-sm text-zinc-400 mb-3">{t.godMode.permissionsDesc}</p>
              {PERMISSION_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/15 bg-zinc-900/70 p-4 w-full"
                >
                  <div className="flex-1 text-start">
                    <div className="text-sm font-bold text-white mb-1">
                      {t.godMode.permissions[key].label}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
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
              <div className="rounded-2xl border border-white/15 bg-zinc-900/70 p-5 w-full">
                <p className="mb-4 font-bold text-base text-white">
                  {t.godMode.danger.quotasTitle}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-zinc-200">{t.godMode.danger.maxEmployees}</Label>
                    <Input
                      type="number"
                      min={company.current_employees_count}
                      value={quotas.maxEmployees}
                      onChange={(e) => setQuotas((q) => ({ ...q, maxEmployees: Number(e.target.value) }))}
                      className="bg-zinc-950 border-white/15 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-zinc-200">{t.godMode.danger.maxDailyClaims}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={quotas.maxDailyClaims}
                      onChange={(e) => setQuotas((q) => ({ ...q, maxDailyClaims: Number(e.target.value) }))}
                      className="bg-zinc-950 border-white/15 text-white"
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

              <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-5 w-full">
                <p className="mb-1 font-bold text-base text-rose-400">
                  {company.status === 'active' ? t.godMode.danger.suspendTitle : t.godMode.danger.activateTitle}
                </p>
                <p className="mb-4 text-sm text-zinc-300 leading-relaxed">
                  {company.status === 'active' ? t.godMode.danger.suspendDesc : t.godMode.danger.activateDesc}
                </p>

                <AlertDialog>
                  <AlertDialogTrigger
                    disabled={isPending}
                    className={
                      company.status === 'active'
                        ? 'inline-flex items-center justify-center rounded-xl border border-rose-500 px-4 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500 hover:text-white disabled:opacity-50'
                        : 'inline-flex items-center justify-center rounded-xl border border-emerald-500 px-4 py-2.5 text-sm font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white disabled:opacity-50'
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
    </div>,
    document.body
  );
}