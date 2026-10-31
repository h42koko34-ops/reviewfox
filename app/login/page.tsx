'use client';

// =========================================================================================
// ReviewFox — Ultra-Glassmorphic 3D Sign-In Experience (Performance-Optimized Build)
// صفحة تسجيل الدخول — نسخة محسّنة للأداء: بدون حلقات Canvas/JS ثقيلة
// 100% GPU-accelerated CSS 3D transforms + static/low-cost SVG + minimal Framer Motion springs.
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
} from 'lucide-react';

// -----------------------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------------------
type Stage = 'splash' | 'login';
type FieldName = 'email' | 'password' | null;

// -----------------------------------------------------------------------------------------
// Blueprint laser-line layout for the splash stage (horizontal + vertical converging lines)
// Pure CSS transform animations — no JS per-frame cost.
// -----------------------------------------------------------------------------------------
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
// Static/low-cost "ReviewFox AI Core" Background
// — zero rAF loops, zero canvas, zero per-frame JS math.
// Built entirely from layered CSS gradients + a tilted SVG grid + CSS-keyframe floaters.
// All animated properties are transform/opacity only (GPU compositor layer, ~0% CPU cost).
// =========================================================================================
function AICoreBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#05060a]">
      {/* base deep-space gradient (static) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,#0b0d14_0%,#05060a_55%,#07050a_100%)]" />

      {/* amber horizon glow aura (static radial gradient, no JS) */}
      <div className="absolute left-1/2 top-[52%] h-[70vh] w-[140vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(249,115,22,0.16)_0%,rgba(249,115,22,0.05)_45%,transparent_70%)] blur-2xl" />

      {/* subtle static starfield via repeating radial-gradient (no DOM nodes, no JS) */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.6) 0, transparent 60%),' +
            'radial-gradient(1px 1px at 80% 15%, rgba(255,255,255,0.5) 0, transparent 60%),' +
            'radial-gradient(1px 1px at 35% 45%, rgba(255,255,255,0.4) 0, transparent 60%),' +
            'radial-gradient(1px 1px at 65% 30%, rgba(255,255,255,0.5) 0, transparent 60%),' +
            'radial-gradient(1px 1px at 90% 55%, rgba(255,255,255,0.35) 0, transparent 60%),' +
            'radial-gradient(1px 1px at 20% 65%, rgba(255,255,255,0.4) 0, transparent 60%),' +
            'radial-gradient(1px 1px at 50% 10%, rgba(255,255,255,0.45) 0, transparent 60%)',
          backgroundSize: '100% 100%',
        }}
      />

      {/* ---- Holographic GPS Zone Grid (floor) — static tilted SVG, pure CSS 3D ---- */}
      <div className="absolute inset-x-0 bottom-0 h-[55vh]" style={{ perspective: '600px' }}>
        <div
          className="absolute inset-0 origin-bottom animate-grid-drift opacity-40"
          style={{
            transform: 'rotateX(62deg) scale(1.6)',
            transformStyle: 'preserve-3d',
            backgroundImage:
              'linear-gradient(rgba(249,180,100,0.35) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(249,180,100,0.35) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'linear-gradient(to top, black 0%, transparent 85%)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 85%)',
          }}
        />
      </div>

      {/* ---- Floating 3D glass elements (CSS-keyframe driven, GPU transform-only) ---- */}
      {/* ⭐ 5-Star Review constellation */}
      <div className="absolute left-[12%] top-[20%] h-28 w-28 animate-float-slow opacity-80 blur-[1px] will-change-transform">
        <div className="relative flex h-full w-full items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-orange-400/25 via-amber-500/15 to-orange-700/10 shadow-[0_0_60px_-10px_rgba(249,115,22,0.55)] backdrop-blur-md">
          <Star className="h-9 w-9 fill-orange-400/80 text-orange-300/80" strokeWidth={1} />
        </div>
      </div>

      {/* 📍 GPS Radar pulse ring */}
      <div className="absolute right-[10%] top-[32%] h-24 w-24 animate-float-medium opacity-70 blur-[1.5px] will-change-transform">
        <div className="relative flex h-full w-full items-center justify-center rounded-full border border-sky-300/20 bg-gradient-to-br from-sky-400/15 to-cyan-600/10 shadow-[0_0_50px_-8px_rgba(56,189,248,0.5)] backdrop-blur-md">
          <span className="absolute h-full w-full animate-ping-slow rounded-full border border-sky-300/30" />
          <MapPin className="h-7 w-7 text-sky-300/80" strokeWidth={1.2} />
        </div>
      </div>

      {/* 🛡️ AI Anti-Fraud Shield prism */}
      <div className="absolute bottom-[18%] left-[18%] h-24 w-24 animate-float-fast opacity-70 blur-[1.5px] will-change-transform">
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-teal-200/15 bg-gradient-to-br from-teal-300/15 via-emerald-500/10 to-teal-800/10 shadow-[0_0_50px_-8px_rgba(45,212,191,0.45)] backdrop-blur-md">
          <ShieldCheck className="h-8 w-8 text-teal-200/80" strokeWidth={1.2} />
        </div>
      </div>

      {/* subtle fourth drifting element for depth */}
      <div className="absolute bottom-[30%] right-[18%] h-16 w-16 animate-float-medium opacity-50 blur-[2px] will-change-transform">
        <div className="flex h-full w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_40px_-10px_rgba(249,180,100,0.4)] backdrop-blur-md">
          <Sparkles className="h-6 w-6 text-orange-200/70" strokeWidth={1.2} />
        </div>
      </div>

      {/* cinematic vignette overlay (static) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]" />

      {/* local keyframes — transform/opacity only, compositor-accelerated, ~0% CPU at idle */}
      <style jsx global>{`
        @keyframes grid-drift {
          0% {
            background-position: 0px 0px;
          }
          100% {
            background-position: 0px 56px;
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
            transform: translate3d(10px, -18px, 0) rotate(3deg);
          }
        }
        @keyframes float-medium {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(-14px, 14px, 0) rotate(-4deg);
          }
        }
        @keyframes float-fast {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(12px, 10px, 0) rotate(5deg);
          }
        }
        .animate-float-slow {
          animation: float-slow 9s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 7.5s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: float-fast 6s ease-in-out infinite;
        }

        @keyframes ping-slow {
          0% {
            transform: scale(0.7);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .animate-ping-slow {
          animation: ping-slow 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-grid-drift,
          .animate-float-slow,
          .animate-float-medium,
          .animate-float-fast,
          .animate-ping-slow {
            animation: none !important;
          }
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

  // Lazy-init Supabase browser client (same exact auth logic as reference)
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  // ----- stage control (splash -> login) -----
  const [stage, setStage] = useState<Stage>('splash');

  // ----- form state -----
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [focusedField, setFocusedField] = useState<FieldName>(null);

  // ----- lightweight 3D tilt (event-driven only, NOT a continuous loop) -----
  // Updates only fire on pointermove events; springs settle and go idle automatically.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springX = useSpring(tiltX, { stiffness: 60, damping: 16, mass: 0.5 });
  const springY = useSpring(tiltY, { stiffness: 60, damping: 16, mass: 0.5 });
  const cardRotateY = useTransform(springX, [-1, 1], [-8, 8]);
  const cardRotateX = useTransform(springY, [-1, 1], [6, -6]);

  const shakeControls = useAnimationControls();

  // splash -> login transition after 2.2s
  useEffect(() => {
    const timer = setTimeout(() => setStage('login'), 2200);
    return () => clearTimeout(timer);
  }, []);

  // error shake trigger
  useEffect(() => {
    if (shakeKey === 0) return;
    shakeControls.start({
      x: [0, -12, 10, -8, 6, -3, 0],
      transition: { duration: 0.5, ease: 'easeInOut' },
    });
  }, [shakeKey, shakeControls]);

  // Pointer tilt — cheap, throttled implicitly by the browser's native pointermove rate.
  // No math beyond simple normalization; no canvas, no projection, no rAF loop.
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

  // ===================== EXACT AUTH LOGIC (kept 100% intact) =====================
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
  // =================================================================================

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative min-h-[100dvh] w-full overflow-hidden bg-[#05060a] font-sans"
    >
      {/* Static/low-cost 3D AI Core background — zero JS animation loops */}
      <AICoreBackground />

      <AnimatePresence>
        {stage === 'splash' ? (
          // =========================== STAGE 1: BLUEPRINT SPLASH ===========================
          <motion.div
            key="splash"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center"
            exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
          >
            {/* laser blueprint lines converging to center — CSS transform only */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {BLUEPRINT_LINES.map((ln, i) => (
                <motion.div
                  key={i}
                  className={`absolute ${
                    ln.vertical ? 'bg-gradient-to-b' : 'bg-gradient-to-r'
                  } from-transparent via-orange-400/50 to-transparent`}
                  style={{ top: ln.top, left: ln.left, right: ln.right, width: ln.width, height: ln.height }}
                  initial={ln.vertical ? { scaleY: 0, opacity: 0 } : { scaleX: 0, opacity: 0 }}
                  animate={ln.vertical ? { scaleY: 1, opacity: 1 } : { scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                />
              ))}
            </div>

            <div style={{ perspective: 1200 }} className="relative flex flex-col items-center">
              <motion.p
                className="absolute -top-10 font-mono text-[10px] uppercase tracking-[0.3em] text-orange-400/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Initializing Secure Core
              </motion.p>

              <div style={{ transformStyle: 'preserve-3d' }} className="relative">
                {/* glowing squircle frame drawing itself */}
                <svg
                  width="180"
                  height="180"
                  viewBox="0 0 180 180"
                  className="drop-shadow-[0_0_30px_rgba(249,115,22,0.5)]"
                >
                  <motion.rect
                    x="10"
                    y="10"
                    width="160"
                    height="160"
                    rx="42"
                    fill="rgba(255,255,255,0.03)"
                    stroke="#F97316"
                    strokeWidth="1.5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                  />
                </svg>

                {/* 3D materializing logo core — shares layoutId with header logo */}
                <motion.div
                  layoutId="rf-logo-core"
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.4, rotateY: 90 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-xl">
                    <Image
                      src="/logo.png"
                      alt="ReviewFox"
                      width={48}
                      height={48}
                      className="object-contain"
                      priority
                    />
                  </div>
                </motion.div>
              </div>

              <motion.h1
                className="mt-8 text-3xl font-bold tracking-tight text-white"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                Review<span className="text-orange-500">Fox</span>
              </motion.h1>

              <motion.p
                dir="rtl"
                className="mt-2 text-sm text-white/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
              >
                منصة إدارة ومطابقة التقييمات الذكية
              </motion.p>

              {/* loading progress sliver */}
              <motion.div className="mt-6 h-[2px] w-40 overflow-hidden rounded-full bg-white/10">
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
            className="absolute inset-0 z-20 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* docked header — logo ascends here via shared layoutId */}
            <motion.header
              className="flex items-center justify-center gap-3 pb-4 pt-10"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                layoutId="rf-logo-core"
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-xl"
              >
                <Image src="/logo.png" alt="ReviewFox" width={26} height={26} className="object-contain" />
              </motion.div>
              <div className="text-right" dir="rtl">
                <h1 className="flex items-center gap-1 text-lg font-bold leading-none text-white">
                  Review<span className="text-orange-500">Fox</span>
                </h1>
                <p className="mt-1 text-[11px] text-white/40">تسجيل الدخول إلى حسابك</p>
              </div>
            </motion.header>

            {/* glass card container with lightweight pointer-driven 3D tilt (GPU transform only) */}
            <div className="flex flex-1 items-center justify-center px-5 pb-10" style={{ perspective: 1400 }}>
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
                  className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/[0.05] p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.35)] backdrop-blur-3xl saturate-[1.8]"
                >
                  {/* ambient glass highlights (static, zero cost) */}
                  <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />

                  {/* periodic shimmer sweep — transform-only, GPU-accelerated */}
                  <motion.div
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ translateX: ['-120%', '160%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
                  />

                  <div dir="rtl" className="relative z-10 space-y-5">
                    <div className="mb-2 text-center">
                      <div className="mb-1 flex items-center justify-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                        <h2 className="text-xl font-bold text-white">تسجيل الدخول</h2>
                      </div>
                      <p className="mt-1 text-xs text-white/40">مرحباً بعودتك، سجّل دخولك للمتابعة</p>
                    </div>

                    {/* ---------------- Email Field ---------------- */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-white/60">
                        البريد الإلكتروني
                      </label>
                      <motion.div
                        animate={{
                          translateZ: focusedField === 'email' ? 12 : 0,
                          borderColor:
                            focusedField === 'email'
                              ? 'rgba(249,115,22,0.6)'
                              : error
                              ? 'rgba(244,63,94,0.5)'
                              : 'rgba(255,255,255,0.12)',
                          boxShadow:
                            focusedField === 'email'
                              ? '0 0 0 4px rgba(249,115,22,0.12), inset 0 1px 1px rgba(255,255,255,0.15)'
                              : '0 0 0 0px rgba(249,115,22,0), inset 0 1px 1px rgba(255,255,255,0.08)',
                        }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2.5 rounded-2xl border bg-white/[0.04] px-4 py-3.5"
                      >
                        <Mail
                          className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
                            focusedField === 'email' ? 'text-orange-400' : 'text-white/40'
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
                          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                        />
                      </motion.div>
                    </div>

                    {/* ---------------- Password Field ---------------- */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-white/60">كلمة المرور</label>
                      <motion.div
                        animate={{
                          translateZ: focusedField === 'password' ? 12 : 0,
                          borderColor:
                            focusedField === 'password'
                              ? 'rgba(249,115,22,0.6)'
                              : error
                              ? 'rgba(244,63,94,0.5)'
                              : 'rgba(255,255,255,0.12)',
                          boxShadow:
                            focusedField === 'password'
                              ? '0 0 0 4px rgba(249,115,22,0.12), inset 0 1px 1px rgba(255,255,255,0.15)'
                              : '0 0 0 0px rgba(249,115,22,0), inset 0 1px 1px rgba(255,255,255,0.08)',
                        }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2.5 rounded-2xl border bg-white/[0.04] px-4 py-3.5"
                      >
                        <Lock
                          className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
                            focusedField === 'password' ? 'text-orange-400' : 'text-white/40'
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
                          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="shrink-0 text-white/40 transition-colors hover:text-white/70"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </motion.div>
                    </div>

                    {/* ---------------- Error Pill ---------------- */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -6, height: 0 }}
                          className="flex items-center gap-2 overflow-hidden rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 backdrop-blur-xl"
                        >
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                          <p className="text-xs text-rose-300">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ---------------- Submit Button (liquid orange energy) ---------------- */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileTap={{ scale: 0.97 }}
                      className="relative mt-2 flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/20 text-sm font-bold text-white shadow-[0_10px_30px_-8px_rgba(249,115,22,0.6),inset_0_1px_0_rgba(255,255,255,0.4)] disabled:opacity-70"
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

                    {/* feature chips — tying back to the product's core value */}
                    <div className="flex items-center justify-center gap-4 pt-3">
                      <div className="flex items-center gap-1.5 text-[10px] text-white/35">
                        <MapPin className="h-3 w-3 text-orange-400/70" /> مطابقة GPS
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/35">
                        <Star className="h-3 w-3 text-orange-400/70" /> تقييمات موثوقة
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/35">
                        <ShieldCheck className="h-3 w-3 text-orange-400/70" /> حماية من الاحتيال
                      </div>
                    </div>
                  </div>
                </motion.form>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}