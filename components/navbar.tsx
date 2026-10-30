// File: components/navbar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Globe, LogOut, Moon, ShieldCheck, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-context';
import { createClient } from '@/lib/supabase/client';

// النافبار الأساسي للموظفين ومديري الشركات
export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl">
            <Image
              src="/logo.png"
              alt="ReviewFox Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Review<span className="text-orange-500">Fox</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="toggle language">
            <Globe className="h-4 w-4" />
            <span className="ms-1 text-xs font-bold">{language === 'ar' ? 'EN' : 'AR'}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="toggle theme"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </Button>

          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

// نافبار مدير النظام (Super Admin)
export function SuperAdminNavbar() {
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/super-admin" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl">
            <Image
              src="/logo.png"
              alt="ReviewFox Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Review<span className="text-orange-500">Fox</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t.nav.superAdmin}
          </span>

          <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="toggle language">
            <Globe className="h-4 w-4" />
            <span className="ms-1 text-xs font-bold">{language === 'ar' ? 'EN' : 'AR'}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="toggle theme"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </Button>

          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}