// File: app/login/page.tsx
'use client';

// =========================================================================================
// ReviewFox — Ultra-Glassmorphic 3D Sign-In Experience (Performance-Optimized + Rich 3D Scene)
// =========================================================================================

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useAnimationControls,
} from 'framer-motion';
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  MapPin,
  Star,
  CheckCircle2,
} from 'lucide-react';

type Stage = 'splash' | 'login';
type FieldName = 'email' | 'password' | null;

const BLUEPRINT_LINES: {
  top?: string;
  left?: string;
  right?: string;
  width?: string;
  height?: string;
  vertical?: boolean;
}[] = [
  { top: '18%', left: '6%', width: '32%', height: '1px' },
  { top: '82%', right: '6%', width: '32%', height: '1px' },
  { top: '50%', left: '0%', width: '100%', height: '1px' },
  { left: '14%', top: '8%', width: '1px', height: '32%', vertical: true },
  { left: '86%', top: '58%', width: '1px', height: '32%', vertical: true },
  { left: '50%', top: '0%', width: '1px', height: '100%', vertical: true },
];

// =========================================================================================
// Rich 3D "ReviewFox AI Core" Background (Fixed Z-Index + Luxury Warm Amber & Cyber Depth)
// =========================================================================================
function AICoreBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#07080f]">
      {/* 1. Base rich warm-midnight radial atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 18%, rgba(249, 115, 22, 0.28) 0%, rgba(180, 83, 9, 0.10) 38%, transparent 68%), ' +
            'radial-gradient(circle at 15% 45%, rgba(234, 88, 12, 0.18) 0%, transparent 50%), ' +
            'radial-gradient(circle at 85% 65%, rgba(56, 189, 248, 0.12) 0%, transparent 50%), ' +
            'radial-gradient(circle at 50% 90%, rgba(245, 158, 11, 0.16) 0%, transparent 55%), ' +
            'linear-gradient(165deg, #110c08 0%, #070910 50%, #0e0a08 100%)',
        }}
      />

      {/* 2. Subtle architectural blueprint grid across the upper sky */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(251, 146, 60, 0.12) 1px, transparent 1px), ' +
            'linear-gradient(to bottom, rgba(251, 146, 60, 0.12) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at 50% 42%, black 25%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 42%, black 25%, transparent 78%)',
        }}
      />

      {/* 3. Center GPS Radar Concentric Rings (Behind the glass card for true refraction) */}
      <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2">
        <div className="h-[310px] w-[310px] sm:h-[440px] sm:w-[440px] rounded-full border border-orange-500/20 shadow-[0_0_90px_rgba(249,115,22,0.18)]" />
        <div className="absolute inset-7 rounded-full border border-dashed border-amber-400/25" />
        <div className="absolute inset-16 rounded-full border border-orange-500/15 bg-gradient-to-b from-orange-500/[0.06] to-transparent" />
      </div>

      {/* 4. Holographic 3D Perspective Floor Grid */}
      <div className="absolute inset-x-0 bottom-0 h-[52vh]" style={{ perspective: '600px' }}>
        <div
          className="absolute inset-0 origin-bottom animate-grid-drift opacity-55"
          style={{
            transform: 'rotateX(62deg) scale(1.6)',
            transformStyle: 'preserve-3d',
            backgroundImage:
              'linear-gradient(rgba(251, 146, 60, 0.42) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(251, 146, 60, 0.42) 1px, transparent 1px)',
            backgroundSize: '54px 54px',
            maskImage: 'linear-gradient(to top, black 5%, transparent 88%)',
            WebkitMaskImage: 'linear-gradient(to top, black 5%, transparent 88%)',
          }}
        />
      </div>

      {/* 5. Floating 3D Glass Badges & Orbs (Positioned so the login card refracts them) */}
      {/* ⭐ Top-Right / Top-Left 5-Star Review Badge */}
      <div className="absolute right-[5%] sm:right-[16%] top-[18%] sm:top-[20%] animate-float-slow will-change-transform">
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/20 via-orange-600/15 to-black/40 px-3.5 py-2.5 shadow-[0_10px_40px_rgba(249,115,22,0.3)] backdrop-blur-md">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-zinc-950 shadow-md">
            <Star className="h-5 w-5 fill-current" />
          </div>
          <div dir="rtl" className="text-right">
            <div className="flex items-center gap-1 text-xs font-extrabold text-amber-200">
              <span>تقييم جوجل 5.0</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="mt-0.5 flex items-center gap-0.5 text-amber-400">
              <Star className="h-2.5 w-2.5 fill-current" />
              <Star className="h-2.5 w-2.5 fill-current" />
              <Star className="h-2.5 w-2.5 fill-current" />
              <Star className="h-2.5 w-2.5 fill-current" />
              <Star className="h-2.5 w-2.5 fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* 📍 Middle-Left GPS Radar Pulse Badge */}
      <div className="absolute left-[4%] sm:left-[15%] top-[28%] sm:top-[30%] animate-float-medium will-change-transform">
        <div className="flex items-center gap-2.5 rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-500/20 via-cyan-600/10 to-black/40 px-3.5 py-2.5 shadow-[0_10px_40px_rgba(56,189,248,0.25)] backdrop-blur-md">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/25 border border-sky-300/40 text-sky-300">
            <span className="absolute h-full w-full animate-ping-slow rounded-xl border border-sky-300/40" />
            <MapPin className="h-5 w-5" />
          </div>
          <div dir="rtl" className="text-right">
            <div className="text-xs font-extrabold text-sky-200">نطاق GPS موثق</div>
            <p className="text-[10px] text-sky-100/70">ربط الفروع الذكي</p>
          </div>
        </div>
      </div>

      {/* 🛡️ Bottom-Left AI Anti-Fraud Shield */}
      <div className="absolute bottom-[13%] left-[8%] sm:left-[18%] animate-float-fast will-change-transform">
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 via-teal-600/10 to-black/40 px-3.5 py-2.5 shadow-[0_10px_40px_rgba(16,185,129,0.25)] backdrop-blur-md">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/25 border border-emerald-300/40 text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div dir="rtl" className="text-right">
            <div className="text-xs font-extrabold text-emerald-200">رادار الحماية AI</div>
            <p className="text-[10px] text-emerald-100/70">كشف الاحتيال الفوري</p>
          </div>
        </div>
      </div>

      {/* ✨ Bottom-Right Ambient Glowing Prism */}
      <div className="absolute bottom-[18%] right-[8%] sm:right-[18%] h-14 w-14 animate-float-medium will-change-transform">
        <div className="flex h-full w-full items-center justify-center rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/25 to-amber-500/5 shadow-[0_0_40px_rgba(249,115,22,0.4)] backdrop-blur-md">
          <Sparkles className="h-6 w-6 text-amber-300" />
        </div>
      </div>

      {/* Soft vignette around screen edges */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />

      <style jsx global>{`
        @keyframes grid-drift {
          0% {
            background-position: 0px 0px;
          }
          100% {
            background-position: 0px 54px;
          }
        }
        .animate-grid-drift {
          animation: grid-drift 6s linear infinite;
        }

        @keyframes float-slow {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(8px, -14px, 0) rotate(2deg);
          }
        }
        @keyframes float-medium {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(-10px, 12px, 0) rotate(-3deg);
          }
        }
        @keyframes float-fast {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(10px, -10px, 0) rotate(3deg);
          }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 7s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: float-fast 6s ease-in-out infinite;
        }

        @keyframes ping-slow {
          0% {
            transform: scale(0.85);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.45);
            opacity: 0;
          }
        }
        .animate-ping-slow {
          animation: ping-slow 2.6s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}

// =========================================================================================
// Main Login Page Component
// =========================================================================================
export default function LoginPage() {
  const router = useRouter();

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [stage, setStage] = useState<Stage>('splash');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [focusedField, setFocusedField] = useState<FieldName>(null);

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springX = useSpring(tiltX, { stiffness: 60, damping: 16, mass: 0.5 });
  const springY = useSpring(tiltY, { stiffness: 60, damping: 16, mass: 0.5 });
  const cardRotateY = useTransform(springX, [-1, 1], [-8, 8]);
  const cardRotateX = useTransform(springY, [-1, 1], [6, -6]);

  const shakeControls = useAnimationControls();

  useEffect(() => {
    const timer = setTimeout(() => setStage('login'), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (shakeKey === 0) return;
    shakeControls.start({
      x: [0, -12, 10, -8, 6, -3, 0],
      transition: { duration: 0.5, ease: 'easeInOut' },
    });
  }, [shakeKey, shakeControls]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    tiltX.set(x);
    tiltY.set(y);
  };

  const handlePointerLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

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
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative min-h-[100dvh] w-full overflow-hidden bg-transparent font-sans select-none"
    >
      {/* Fixed: Background now renders at z-0 while parent is bg-transparent */}
      <AICoreBackground />

      <AnimatePresence>
        {stage === 'splash' ? (
          // =========================== STAGE 1: BLUEPRINT SPLASH ===========================
          <motion.div
            key="splash"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#07080f]/80 backdrop-blur-md"
            exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {BLUEPRINT_LINES.map((ln, i) => (
                <motion.div
                  key={i}
                  className={`absolute ${
                    ln.vertical ? 'bg-gradient-to-b' : 'bg-gradient-to-r'
                  } from-transparent via-orange-400/60 to-transparent`}
                  style={{ top: ln.top, left: ln.left, right: ln.right, width: ln.width, height: ln.height }}
                  initial={ln.vertical ? { scaleY: 0, opacity: 0 } : { scaleX: 0, opacity: 0 }}
                  animate={ln.vertical ? { scaleY: 1, opacity: 1 } : { scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                />
              ))}
            </div>

            <div style={{ perspective: 1200 }} className="relative flex flex-col items-center">
              <motion.p
                className="absolute -top-10 font-mono text-[10px] uppercase tracking-[0.3em] text-orange-400/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Initializing Secure Core
              </motion.p>

              <div style={{ transformStyle: 'preserve-3d' }} className="relative">
                <svg
                  width="180"
                  height="180"
                  viewBox="0 0 180 180"
                  className="drop-shadow-[0_0_35px_rgba(249,115,22,0.55)]"
                >
                  <motion.rect
                    x="10"
                    y="10"
                    width="160"
                    height="160"
                    rx="42"
                    fill="rgba(255,255,255,0.04)"
                    stroke="#F97316"
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                  />
                </svg>

                <motion.div
                  layoutId="rf-logo-core"
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.4, rotateY: 90 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/25 bg-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.45)] backdrop-blur-xl">
                    <Image
                      src="/logo.png"
                      alt="ReviewFox"
                      width={52}
                      height={52}
                      className="object-contain"
                      priority
                    />
                  </div>
                </motion.div>
              </div>

              <motion.h1
                className="mt-8 text-3xl font-extrabold tracking-tight text-white"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                Review<span className="text-orange-500">Fox</span>
              </motion.h1>

              <motion.p
                dir="rtl"
                className="mt-2 text-sm text-white/65"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
              >
                منصة إدارة ومطابقة التقييمات الذكية
              </motion.p>

              <motion.div className="mt-6 h-[2.5px] w-44 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-300"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.9, ease: 'easeInOut' }}
                />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          // =========================== STAGE 2: VISIONOS LOGIN CARD ===========================
          <motion.div
            key="login"
            className="relative z-20 flex min-h-[100dvh] flex-col justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Top Glass Header */}
            <motion.header
              className="flex items-center justify-center gap-3 border-b border-white/10 bg-black/25 backdrop-blur-xl py-4 px-6"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                layoutId="rf-logo-core"
                className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/40 bg-zinc-900/80 shadow-[0_0_25px_rgba(249,115,22,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)] backdrop-blur-xl"
              >
                <Image src="/logo.png" alt="ReviewFox" width={30} height={30} className="object-contain" />
              </motion.div>
              <div className="text-right" dir="rtl">
                <h1 className="flex items-center gap-1 text-lg font-extrabold leading-none text-white">
                  Review<span className="text-orange-500">Fox</span>
                </h1>
                <p className="mt-1 text-[11px] text-white/60">تسجيل الدخول إلى حسابك</p>
              </div>
            </motion.header>

            {/* Center 3D Glass Card */}
            <div className="flex flex-1 items-center justify-center px-5 py-8" style={{ perspective: 1400 }}>
              <motion.div
                style={{
                  rotateX: cardRotateX,
                  rotateY: cardRotateY,
                  transformStyle: 'preserve-3d',
                  willChange: 'transform',
                }}
                initial={{ y: 60, opacity: 0, scale: 0.94 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-sm"
              >
                <motion.form
                  onSubmit={handleLogin}
                  animate={shakeControls}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="relative overflow-hidden rounded-[32px] border border-white/20 bg-gradient-to-b from-white/[0.12] via-zinc-900/65 to-zinc-950/80 p-7 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.85),inset_0_1px_1.5px_rgba(255,255,255,0.4)] backdrop-blur-2xl saturate-[1.8]"
                >
                  {/* Specular internal orange/white glow */}
                  <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />

                  {/* Periodic light shimmer */}
                  <motion.div
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ translateX: ['-120%', '160%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
                  />

                  <div dir="rtl" className="relative z-10 space-y-5">
                    <div className="mb-2 text-center">
                      <div className="mb-1 flex items-center justify-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-orange-400" />
                        <h2 className="text-2xl font-extrabold text-white">تسجيل الدخول</h2>
                      </div>
                      <p className="mt-1 text-xs text-white/60">مرحباً بعودتك، سجّل دخولك للمتابعة</p>
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-white/80">
                        البريد الإلكتروني
                      </label>
                      <motion.div
                        animate={{
                          translateZ: focusedField === 'email' ? 12 : 0,
                          borderColor:
                            focusedField === 'email'
                              ? 'rgba(249,115,22,0.7)'
                              : error
                              ? 'rgba(244,63,94,0.6)'
                              : 'rgba(255,255,255,0.16)',
                          boxShadow:
                            focusedField === 'email'
                              ? '0 0 0 4px rgba(249,115,22,0.15), inset 0 1px 1px rgba(255,255,255,0.2)'
                              : '0 0 0 0px rgba(249,115,22,0), inset 0 1px 1px rgba(255,255,255,0.08)',
                        }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2.5 rounded-2xl border bg-black/45 px-4 py-3.5"
                      >
                        <Mail
                          className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
                            focusedField === 'email' ? 'text-orange-400' : 'text-white/50'
                          }`}
                        />
                        <input
                          type="email"
                          dir="ltr"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="name@company.com"
                          className="w-full !bg-transparent !border-0 text-sm text-white outline-none placeholder:text-white/35"
                        />
                      </motion.div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-white/80">كلمة المرور</label>
                      <motion.div
                        animate={{
                          translateZ: focusedField === 'password' ? 12 : 0,
                          borderColor:
                            focusedField === 'password'
                              ? 'rgba(249,115,22,0.7)'
                              : error
                              ? 'rgba(244,63,94,0.6)'
                              : 'rgba(255,255,255,0.16)',
                          boxShadow:
                            focusedField === 'password'
                              ? '0 0 0 4px rgba(249,115,22,0.15), inset 0 1px 1px rgba(255,255,255,0.2)'
                              : '0 0 0 0px rgba(249,115,22,0), inset 0 1px 1px rgba(255,255,255,0.08)',
                        }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2.5 rounded-2xl border bg-black/45 px-4 py-3.5"
                      >
                        <Lock
                          className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
                            focusedField === 'password' ? 'text-orange-400' : 'text-white/50'
                          }`}
                        />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          dir="ltr"
                          required
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="••••••••"
                          className="w-full !bg-transparent !border-0 text-sm text-white outline-none placeholder:text-white/35"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="shrink-0 text-white/50 transition-colors hover:text-white"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </motion.div>
                    </div>

                    {/* Error Pill */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -6, height: 0 }}
                          className="flex items-center gap-2 overflow-hidden rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2.5 backdrop-blur-xl"
                        >
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                          <p className="text-xs font-bold text-rose-200">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileTap={{ scale: 0.97 }}
                      className="relative mt-2 flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/25 text-sm font-extrabold text-white shadow-[0_12px_35px_-6px_rgba(249,115,22,0.65),inset_0_1px_0_rgba(255,255,255,0.45)] disabled:opacity-70 cursor-pointer"
                    >
                      <motion.span
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(110deg, #f97316 0%, #fb923c 25%, #ea580c 50%, #fb923c 75%, #f97316 100%)',
                          backgroundSize: '200% 100%',
                        }}
                        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                      />
                      <span className="relative z-10 flex items-center gap-2">
                        <AnimatePresence mode="wait" initial={false}>
                          {loading ? (
                            <motion.span
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-2"
                            >
                              <Loader2 className="h-4 w-4 animate-spin" />
                              جاري الدخول...
                            </motion.span>
                          ) : (
                            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              تسجيل الدخول
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                    </motion.button>

                    {/* Feature Chips */}
                    <div className="flex items-center justify-center gap-4 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60">
                        <MapPin className="h-3.5 w-3.5 text-orange-400" /> مطابقة GPS
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60">
                        <Star className="h-3.5 w-3.5 text-amber-400" /> تقييمات موثوقة
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> حماية من الاحتيال
                      </div>
                    </div>
                  </div>
                </motion.form>
              </motion.div>
            </div>

            <div className="h-2" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}