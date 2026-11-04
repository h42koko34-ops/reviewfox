// File: app/loading.tsx
'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Star, ShieldCheck } from 'lucide-react';

const loadingTips = [
  'جاري تأمين الجلسة وتشفير البيانات بمعايير الأمان... 🔒',
  'تحديث النطاق الجغرافي والتحقق من صلاحيات الفرع... 📍',
  'تجهيز البوابة الذكية ومطابقة التقييمات بالذكاء الاصطناعي... 🤖',
  'نصيحة: استخدام ماسح الفواتير بالـ OCR يوفر 70% من وقتك! ⚡',
];

export default function Loading() {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % loadingTips.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-zinc-950 px-6 py-12 text-white select-none">
      {/* 1. شريط تقدم ذكي متحرك أعلى الشاشة */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 animate-pulse w-full" />
      </div>

      <div className="w-full" />

      {/* 2. محتوى المنتصف: دمج الشعار، الهالة، النجوم، والنصائح المتحركة */}
      <div className="flex flex-col items-center space-y-6 text-center max-w-sm">
        {/* اللوجو النابض مع هالة الرادار */}
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
            <span>منصة إدارة التقييمات الذكية</span>
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

      {/* تذييل الشاشة الأمني */}
      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        <span>نظام محمي ومشفر بالكامل</span>
      </div>
    </div>
  );
}