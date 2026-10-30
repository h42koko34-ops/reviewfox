// File: components/employee/employee-topbar.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Globe, LogOut, Moon, Sun, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-context';
import { createClient } from '@/lib/supabase/client';

export function EmployeeTopbar({ fullName, points }: { fullName: string; points: number }) {
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
    <header className="sticky top-0 z-40 border-b border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-xs font-extrabold text-white shadow-lg shadow-orange-500/30">
            RF
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-zinc-900 dark:text-white">{fullName}</p>
            <p className="flex items-center gap-1 text-xs font-medium text-orange-500">
              <Zap className="h-3 w-3 fill-orange-500" />
              {points} {t.common.points}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleLanguage} className="h-9 w-9">
            <Globe className="h-4 w-4" />
            <span className="ms-1 text-[10px] font-bold">{language === 'ar' ? 'EN' : 'AR'}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="h-9 w-9">
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}