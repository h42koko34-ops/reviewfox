// File: app/suspended/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-context';
import { createClient } from '@/lib/supabase/client';

export default function SuspendedPage() {
  const { t, toggleLanguage, language } = useLanguage();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-rose-50 via-white to-orange-50 px-6 text-center dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
        <ShieldOff className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white">
        {language === 'ar' ? 'تم إيقاف هذه الشركة مؤقتًا' : 'This Company Has Been Suspended'}
      </h1>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {language === 'ar'
          ? 'يرجى التواصل مع إدارة ReviewFox لإعادة تفعيل الوصول.'
          : 'Please contact ReviewFox administration to restore access.'}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={toggleLanguage}>
          {language === 'ar' ? 'EN' : 'AR'}
        </Button>
        <Button onClick={handleLogout} className="bg-orange-500 text-white hover:bg-orange-600">
          {t.common.logout}
        </Button>
      </div>
    </div>
  );
}