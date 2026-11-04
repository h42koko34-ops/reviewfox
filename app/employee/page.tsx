// File: app/employee/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Star, ShieldCheck } from 'lucide-react';
import type { EnabledFeatures, PreClaim } from '@/lib/types/database';
import { getEmployeeBundle } from './actions';
import { NewClaimForm } from '@/components/employee/new-claim-form';
import { DailyLimitBanner } from '@/components/employee/daily-limit-banner';
import { ProfileSettingsModal } from '@/components/account/profile-settings-modal';

const loadingTips = [
  'جاري تأمين الجلسة وتشفير البيانات بمعايير الأمان... 🔒',
  'تحديث النطاق الجغرافي والتحقق من صلاحيات الفرع... 📍',
  'تجهيز البوابة الذكية ومطابقة التقييمات بالذكاء الاصطناعي... 🤖',
  'نصيحة: استخدام ماسح الفواتير بالـ OCR يوفر 70% من وقتك! ⚡',
];

const CACHE_KEY = 'rf_employee_bundle_cache';

export default function EmployeeNewClaimPage() {
  const [data, setData] = useState<{
    enabledFeatures: EnabledFeatures;
    maxDailyClaims: number;
    todayClaimsCount: number;
  } | null>(() => {
    // قراءة الكاش فوراً في نفس اللحظة لمنع ظهور أي شاشة انتظار عند التنقل
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore cache error
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(() => !data);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % loadingTips.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    let active = true;
    getEmployeeBundle().then((result) => {
      if (!active) return;
      if (result.success && result.enabledFeatures) {
        const freshData = {
          enabledFeatures: result.enabledFeatures,
          maxDailyClaims: result.maxDailyClaims ?? 5,
          todayClaimsCount: result.todayClaimsCount ?? 0,
        };
        setData(freshData);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
        } catch {
          // ignore storage quota errors
        }
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // بدلاً من الدائرة الفارغة، تظهر شاشة الترحيب المتكاملة حتى تجهز البيانات
  if (isLoading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-zinc-950 px-6 py-12 text-white select-none">
        {/* 1. شريط تقدم ذكي متحرك أعلى الشاشة */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 animate-pulse w-full" />
        </div>

        <div className="w-full" />

        {/* 2. محتوى المنتصف: الشعار النابض، الهالة، النجوم، والنصائح */}
        <div className="flex flex-col items-center space-y-6 text-center max-w-sm">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-28 w-28 rounded-full bg-orange-500/20 animate-ping" />
            <div className="absolute h-36 w-36 rounded-full bg-orange-500/10 animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-2xl shadow-orange-500/40 text-white font-black text-2xl tracking-wider">
              RF
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              ReviewFox
            </h1>
            <p className="text-xs text-orange-400 font-semibold tracking-wide flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
              <span>بوابة الفني الذكية</span>
            </p>
          </div>

          {/* 3. موجة النجوم الخمس الذهبية */}
          <div className="flex items-center gap-1.5 py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="h-4 w-4 fill-amber-400 text-amber-400 animate-pulse"
                style={{ animationDelay: `${star * 200}ms` }}
              />
            ))}
          </div>

          {/* 4 & 5. رادار الحالة والنصائح التحفيزية المتغيرة */}
          <div className="min-h-[48px] w-full flex items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-2.5 backdrop-blur-md shadow-inner">
            <p className="text-xs text-zinc-300 font-medium transition-all duration-300">
              {loadingTips[tipIndex]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>نظام محمي ومشفر بالكامل</span>
        </div>
      </div>
    );
  }

  const remaining = Math.max(data.maxDailyClaims - data.todayClaimsCount, 0);

  return (
    <div className="space-y-4">
      {/* شريط علوي للوصول السريع لإعدادات حساب الفني */}
      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
          <Sparkles className="h-4 w-4 text-orange-500 shrink-0" />
          <span>بوابة الفني الذكية</span>
        </div>
        <ProfileSettingsModal />
      </div>

      <DailyLimitBanner used={data.todayClaimsCount} max={data.maxDailyClaims} />

      <NewClaimForm
        enabledFeatures={data.enabledFeatures}
        remaining={remaining}
        onSubmitted={(claim: PreClaim) => {
          setData((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, todayClaimsCount: prev.todayClaimsCount + 1 };
            try {
              sessionStorage.setItem(CACHE_KEY, JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
          void claim;
        }}
      />
    </div>
  );
}