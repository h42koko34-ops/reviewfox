// File: app/login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  // مراحل الأنيميشن مثل الفيديو الأول: 'splash' (رسم اللوجو) ثم 'auth' (انزلاق كارت الدخول)
  const [stage, setStage] = useState<'splash' | 'auth'>('splash');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStage('auth');
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

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
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      setShakeKey((prev) => prev + 1);
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#06070b] flex flex-col justify-between select-none">
      {/* خلفية الشبكة الهندسية (Blueprint Grid) مثل الفيديو الأول */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      {/* توهج برتقالي خلفي */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-orange-500/20 blur-[110px]" />

      {/* ==========================================
          المرحلة 1: شاشة البداية المتحركة (Splash)
         ========================================== */}
      <AnimatePresence mode="wait">
        {stage === 'splash' && (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.08, filter: 'blur(10px)' }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6"
          >
            {/* خطوط هندسية متقاطعة حول اللوجو مثل الفيديو الأول */}
            <div className="relative flex items-center justify-center">
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 0.35 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute h-[1px] bg-gradient-to-r from-transparent via-orange-400 to-transparent -top-4"
              />
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 0.35 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                className="absolute h-[1px] bg-gradient-to-r from-transparent via-orange-400 to-transparent -bottom-4"
              />
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 240, opacity: 0.35 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
                className="absolute w-[1px] bg-gradient-to-b from-transparent via-orange-400 to-transparent -left-4"
              />
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 240, opacity: 0.35 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                className="absolute w-[1px] bg-gradient-to-b from-transparent via-orange-400 to-transparent -right-4"
              />

              {/* مربع الإطار المرسوم SVG */}
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <motion.rect
                  x="6"
                  y="6"
                  width="108"
                  height="108"
                  rx="28"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="2.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.1, ease: 'easeInOut' }}
                />
              </svg>

              {/* ظهور لوجو الثعلب في المنتصف */}
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.6, type: 'spring', stiffness: 200 }}
                className="absolute inset-3 rounded-3xl bg-zinc-900/90 border border-white/10 p-3 shadow-2xl shadow-orange-500/30 flex items-center justify-center overflow-hidden"
              >
                <Image
                  src="/logo.png"
                  alt="ReviewFox"
                  fill
                  sizes="110px"
                  className="object-contain p-2"
                  priority
                />
              </motion.div>
            </div>

            {/* ظهور اسم البرنامج والوصف تحت اللوجو */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="mt-7 text-center"
            >
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Review<span className="text-orange-500">Fox</span>
              </h1>
              <p className="mt-1.5 text-xs text-zinc-400">
                منصة إدارة ومطابقة التقييمات الذكية
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          المرحلة 2: شاشة تسجيل الدخول المنزلقة
         ========================================== */}
      {stage === 'auth' && (
        <div className="relative z-20 flex min-h-screen flex-col justify-between">
          {/* الجزء العلوي الداكن (الترحيب واللوجو المصغر مثل الفيديو الأول) */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center pt-12 pb-6 px-6 text-center"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="relative h-10 w-10 rounded-xl bg-zinc-900 border border-orange-500/40 p-1.5 shadow-lg shadow-orange-500/20 overflow-hidden">
                <Image src="/logo.png" alt="ReviewFox" fill sizes="40px" className="object-contain p-1" priority />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Review<span className="text-orange-500">Fox</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              مرحباً بعودتك
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              سجّل دخولك للمتابعة إلى لوحة التحكم الذكية
            </p>
          </motion.div>

          {/* البطاقة السفلية المنزلقة للأعلى (Bottom Sheet) مثل الفيديو الأول */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="w-full max-w-lg mx-auto rounded-t-[36px] sm:rounded-[36px] sm:mb-auto bg-zinc-900/80 backdrop-blur-2xl border-t sm:border border-white/15 p-7 sm:p-9 shadow-[0_-20px_60px_rgba(0,0,0,0.7)]"
          >
            {/* شريط علوي يدل على أنه تسجيل دخول فقط */}
            <div className="mb-6 flex items-center justify-center rounded-2xl bg-black/40 p-1.5 border border-white/10">
              <div className="w-full rounded-xl bg-orange-500 py-2.5 text-center text-xs sm:text-sm font-extrabold text-white shadow-md shadow-orange-500/25">
                تسجيل الدخول / Sign In
              </div>
            </div>

            <motion.form
              key={shakeKey}
              animate={error ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              {/* حقل البريد الإلكتروني */}
              <div>
                <div
                  className={`relative flex items-center rounded-2xl border transition-all ${
                    error
                      ? 'border-rose-500 bg-rose-500/10'
                      : 'border-white/15 bg-black/40 focus-within:border-orange-500'
                  }`}
                >
                  <Mail
                    className={`w-4 h-4 absolute left-4 ${
                      error ? 'text-rose-400' : 'text-zinc-400'
                    }`}
                  />
                  <input
                    dir="ltr"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Email address / البريد الإلكتروني"
                    className="w-full !bg-transparent !border-0 rounded-2xl pl-11 pr-4 py-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* حقل كلمة المرور */}
              <div>
                <div
                  className={`relative flex items-center rounded-2xl border transition-all ${
                    error
                      ? 'border-rose-500 bg-rose-500/10'
                      : 'border-white/15 bg-black/40 focus-within:border-orange-500'
                  }`}
                >
                  <Lock
                    className={`w-4 h-4 absolute left-4 ${
                      error ? 'text-rose-400' : 'text-zinc-400'
                    }`}
                  />
                  <input
                    dir="ltr"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Password / كلمة المرور"
                    className="w-full !bg-transparent !border-0 rounded-2xl pl-11 pr-11 py-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-zinc-400 hover:text-white p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* رسالة الخطأ أسفل الحقول مثل الفيديو الأول */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-rose-400 text-xs font-semibold px-1 pt-1"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* زر تسجيل الدخول المتحرك */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] disabled:opacity-70 text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-orange-500/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <span>تسجيل الدخول / Sign In</span>
                  )}
                </button>
              </div>
            </motion.form>
          </motion.div>
        </div>
      )}
    </div>
  );
}