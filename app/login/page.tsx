// File: app/login/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError('بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور.');
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'super_admin') {
        router.push('/super-admin');
      } else if (profile?.role === 'company_admin') {
        router.push('/dashboard');
      } else {
        router.push('/employee');
      }
      router.refresh();
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center reviewfox-bg text-white p-4 overflow-hidden">
      {/* دوائر إضاءة خلفية متحركة وناعمة */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-orange-500/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-amber-600/10 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md glass-card rounded-[32px] p-8 sm:p-10"
      >
        {/* اللوجو والعنوان */}
        <div className="flex flex-col items-center text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="relative w-20 h-20 rounded-2xl bg-zinc-900/90 border border-orange-500/40 p-2 shadow-xl shadow-orange-500/15 mb-4 flex items-center justify-center overflow-hidden"
          >
            <Image
              src="/logo.png"
              alt="ReviewFox Logo"
              fill
              sizes="80px"
              className="object-contain p-1.5"
              priority
            />
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Review<span className="text-orange-500">Fox</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span>منصة إدارة ومطابقة التقييمات الذكية</span>
          </p>
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm text-center font-medium backdrop-blur-md"
          >
            {error}
          </motion.div>
        )}

        {/* نموذج تسجيل الدخول فقط */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2 text-right">
              البريد الإلكتروني / Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                dir="ltr"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-zinc-950/70 border border-zinc-800/80 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition backdrop-blur-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2 text-right">
              كلمة المرور / Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                dir="ltr"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950/70 border border-zinc-800/80 rounded-2xl pl-10 pr-10 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 mt-6 text-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري تسجيل الدخول...</span>
              </>
            ) : (
              <span>تسجيل الدخول / Sign In</span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}