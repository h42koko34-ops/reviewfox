'use client';

// =========================================================================================
// ReviewFox — Ultra-Glassmorphic 3D Sign-In Experience
// صفحة تسجيل الدخول — تجربة زجاجية ثلاثية الأبعاد بمستوى تطبيقات iOS 18 / VisionOS
// Zero heavy 3D deps: pure <canvas> 3D projection math + CSS 3D + Framer Motion springs.
// =========================================================================================

import { useEffect, useRef, useState } from 'react';
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
  MotionValue,
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
// 3D math helpers — hand-rolled perspective projection (no three.js needed)
// =========================================================================================
function rotateY(x: number, y: number, z: number, a: number) {
  return { x: x * Math.cos(a) + z * Math.sin(a), y, z: -x * Math.sin(a) + z * Math.cos(a) };
}
function rotateX(x: number, y: number, z: number, a: number) {
  return { x, y: y * Math.cos(a) - z * Math.sin(a), z: y * Math.sin(a) + z * Math.cos(a) };
}

const FOV = 460;
const CAM_Z = 280;

function project(x: number, y: number, z: number, width: number, height: number) {
  const denom = Math.max(z + CAM_Z, 1);
  const scale = FOV / denom;
  return { sx: width / 2 + x * scale, sy: height * 0.52 + y * scale, scale };
}

// -----------------------------------------------------------------------------------------
// Decorative draw functions for the floating "glass" elements
// representing ReviewFox's core features: reviews, GPS zones, anti-fraud shield
// -----------------------------------------------------------------------------------------
function drawStarBadge(ctx: CanvasRenderingContext2D, scale: number, t: number) {
  const spikes = 5;
  const outerR = scale * 0.5;
  const innerR = outerR * 0.45;
  ctx.save();
  ctx.rotate(t * 0.15);
  const grad = ctx.createLinearGradient(-outerR, -outerR, outerR, outerR);
  grad.addColorStop(0, 'rgba(253,224,171,0.9)');
  grad.addColorStop(0.5, 'rgba(249,115,22,0.85)');
  grad.addColorStop(1, 'rgba(194,65,12,0.7)');
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(249,115,22,0.8)';
  ctx.shadowBlur = outerR * 0.9;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.stroke();
  ctx.restore();
}

function drawRadarPulse(ctx: CanvasRenderingContext2D, scale: number, t: number) {
  const baseR = scale * 0.6;
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.6 + i / 3) % 1;
    const r = baseR * phase;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(56,189,248,${0.55 * (1 - phase)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, baseR * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(56,189,248,0.9)';
  ctx.shadowColor = 'rgba(56,189,248,0.9)';
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.restore();
}

function drawShieldPrism(ctx: CanvasRenderingContext2D, scale: number, t: number) {
  const s = scale * 0.5;
  ctx.save();
  ctx.rotate(Math.sin(t * 0.2) * 0.15);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.85, -s * 0.35);
  ctx.lineTo(s * 0.6, s * 0.8);
  ctx.lineTo(0, s);
  ctx.lineTo(-s * 0.6, s * 0.8);
  ctx.lineTo(-s * 0.85, -s * 0.35);
  ctx.closePath();
  const grad = ctx.createLinearGradient(-s, -s, s, s);
  grad.addColorStop(0, 'rgba(226,232,240,0.5)');
  grad.addColorStop(0.5, 'rgba(45,212,191,0.35)');
  grad.addColorStop(1, 'rgba(15,118,110,0.4)');
  ctx.fillStyle = grad;
  ctx.strokeStyle = 'rgba(226,232,240,0.6)';
  ctx.lineWidth = 1.2;
  ctx.shadowColor = 'rgba(45,212,191,0.6)';
  ctx.shadowBlur = s * 0.6;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// =========================================================================================
// The "ReviewFox AI Core" 3D background — holographic GPS grid + floating glass icons
// =========================================================================================
function AICoreBackground({
  pointerX,
  pointerY,
  stage,
}: {
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  stage: Stage;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const starsRef = useRef<{ x: number; y: number; r: number; phase: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      starsRef.current = Array.from({ length: 90 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.6,
        r: Math.random() * 1.2 + 0.2,
        phase: Math.random() * Math.PI * 2,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    // floating glass elements representing: ⭐ reviews, 📍 GPS zones, 🛡️ anti-fraud shield
    const floaters = [
      { type: 'star' as const, x: -340, y: -150, z: 760, amp: 46, freq: 0.35, phase: 0 },
      { type: 'radar' as const, x: 360, y: -50, z: 980, amp: 60, freq: 0.28, phase: 1.4 },
      { type: 'shield' as const, x: -220, y: 190, z: 1200, amp: 50, freq: 0.22, phase: 2.6 },
      { type: 'star' as const, x: 300, y: 230, z: 1480, amp: 70, freq: 0.3, phase: 4.1 },
    ];

    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);

      // background vertical gradient — deep night with warm horizon
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#05060a');
      bg.addColorStop(0.55, '#07080d');
      bg.addColorStop(1, '#0a0705');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // twinkling starfield
      starsRef.current.forEach((s) => {
        const alpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 0.6 + s.phase));
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.5})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      const yaw = pointerX.get() * 0.22 + Math.sin(t * 0.05) * 0.04;
      const pitch = pointerY.get() * 0.12;

      // amber horizon glow aura
      const horizonY = height * 0.52;
      const glow = ctx.createRadialGradient(width / 2, horizonY, 10, width / 2, horizonY, width * 0.65);
      glow.addColorStop(0, 'rgba(249,115,22,0.18)');
      glow.addColorStop(0.5, 'rgba(249,115,22,0.05)');
      glow.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // ---- holographic GPS zone grid (floor) ----
      const FLOOR_Y = 260;
      const FAR = 2600;
      const ROWS = 15;
      const SPAN_X = 1700;

      ctx.lineWidth = 1;
      for (let i = 0; i <= ROWS; i++) {
        const d = (i / ROWS) ** 1.5 * FAR;
        const pts: { sx: number; sy: number }[] = [];
        for (let j = -10; j <= 10; j++) {
          const x0 = (j / 10) * SPAN_X;
          const ry = rotateY(x0, FLOOR_Y, d, yaw);
          const rx = rotateX(ry.x, ry.y, ry.z, pitch);
          pts.push(project(rx.x, rx.y, rx.z, width, height));
        }
        const alpha = Math.max(0, 1 - d / FAR) * 0.5;
        ctx.strokeStyle = `rgba(249,180,100,${alpha})`;
        ctx.beginPath();
        pts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.sx, pt.sy) : ctx.lineTo(pt.sx, pt.sy)));
        ctx.stroke();
      }

      const COLS = 21;
      for (let i = 0; i <= COLS; i++) {
        const xr = (i / COLS) * 2 - 1;
        const x0 = xr * SPAN_X;
        const pts: { sx: number; sy: number }[] = [];
        for (let k = 0; k <= 20; k++) {
          const d = (k / 20) ** 1.5 * FAR;
          const ry = rotateY(x0, FLOOR_Y, d, yaw);
          const rx = rotateX(ry.x, ry.y, ry.z, pitch);
          pts.push(project(rx.x, rx.y, rx.z, width, height));
        }
        const alpha = (1 - Math.abs(xr)) * 0.26;
        ctx.strokeStyle = `rgba(249,180,100,${alpha})`;
        ctx.beginPath();
        pts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.sx, pt.sy) : ctx.lineTo(pt.sx, pt.sy)));
        ctx.stroke();
      }

      // ---- floating out-of-focus glass elements ----
      floaters.forEach((f) => {
        const dx = Math.sin(t * f.freq + f.phase) * f.amp;
        const dy = Math.cos(t * f.freq * 1.3 + f.phase) * f.amp * 0.6;
        const dz = Math.sin(t * f.freq * 0.7 + f.phase) * f.amp * 0.5;
        const px = f.x + dx;
        const py = f.y + dy;
        const pz = f.z + dz;

        const ry = rotateY(px, py, pz, yaw);
        const rx = rotateX(ry.x, ry.y, ry.z, pitch);
        const proj = project(rx.x, rx.y, rx.z, width, height);
        const scale = Math.max(proj.scale * 90, 10);
        const blurAmt = Math.min(7, 1.5 + pz / 500);

        ctx.save();
        ctx.filter = `blur(${blurAmt.toFixed(1)}px)`;
        ctx.globalAlpha = 0.85;
        ctx.translate(proj.sx, proj.sy);

        if (f.type === 'star') drawStarBadge(ctx, scale, t);
        else if (f.type === 'radar') drawRadarPulse(ctx, scale, t);
        else drawShieldPrism(ctx, scale, t);

        ctx.restore();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full"
      style={{ opacity: stage === 'splash' ? 0.65 : 1, transition: 'opacity 1.2s ease' }}
    />
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

  // ----- 3D parallax motion values (pointer + mobile tilt) -----
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 14, mass: 0.6 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 14, mass: 0.6 });
  const cardRotateY = useTransform(springX, [-1, 1], [-10, 10]);
  const cardRotateX = useTransform(springY, [-1, 1], [8, -8]);

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

  // pointer parallax (mouse + touch)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    mouseX.set(x);
    mouseY.set(y);
  };

  // mobile gyroscope tilt (graceful no-op if unsupported/unauthorized)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      const x = Math.max(-1, Math.min(1, e.gamma / 30));
      const y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [mouseX, mouseY]);

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
      className="relative min-h-[100dvh] w-full overflow-hidden bg-[#05060a] font-sans"
    >
      {/* 3D AI Core background: holographic grid + floating glass icons */}
      <AICoreBackground pointerX={springX} pointerY={springY} stage={stage} />

      {/* cinematic vignette overlay */}
      <div className="pointer-events-none fixed inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]" />

      <AnimatePresence>
        {stage === 'splash' ? (
          // =========================== STAGE 1: BLUEPRINT SPLASH ===========================
          <motion.div
            key="splash"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center"
            exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
          >
            {/* laser blueprint lines converging to center */}
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
                  transition={{ duration: 0.9, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                />
              ))}
            </div>

            <div style={{ perspective: 1200 }} className="relative flex flex-col items-center">
              <motion.p
                className="absolute -top-10 font-mono text-[10px] uppercase tracking-[0.3em] text-orange-400/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
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
                    transition={{ duration: 1.1, ease: 'easeInOut' }}
                  />
                </svg>

                {/* 3D materializing logo core — shares layoutId with header logo */}
                <motion.div
                  layoutId="rf-logo-core"
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.4, rotateY: 90, z: -200 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0, z: 0 }}
                  transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                transition={{ delay: 1.0, duration: 0.6 }}
              >
                Review<span className="text-orange-500">Fox</span>
              </motion.h1>

              <motion.p
                dir="rtl"
                className="mt-2 text-sm text-white/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
              >
                منصة إدارة ومطابقة التقييمات الذكية
              </motion.p>

              {/* loading progress sliver */}
              <motion.div className="mt-6 h-[2px] w-40 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-300"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.0, ease: 'easeInOut' }}
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
              transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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

            {/* glass card container with pointer-driven 3D tilt */}
            <div className="flex flex-1 items-center justify-center px-5 pb-10" style={{ perspective: 1400 }}>
              <motion.div
                style={{ rotateX: cardRotateX, rotateY: cardRotateY, transformStyle: 'preserve-3d' }}
                initial={{ y: 80, opacity: 0, scale: 0.92 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-sm"
              >
                <motion.form
                  onSubmit={handleLogin}
                  animate={shakeControls}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/[0.05] p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.35)] backdrop-blur-3xl saturate-[1.8]"
                >
                  {/* ambient glass highlights */}
                  <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />

                  {/* periodic shimmer sweep */}
                  <motion.div
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ translateX: ['-120%', '160%'] }}
                    transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
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
                          z: focusedField === 'email' ? 18 : 0,
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
                        transition={{ duration: 0.25 }}
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
                          z: focusedField === 'password' ? 18 : 0,
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
                        transition={{ duration: 0.25 }}
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