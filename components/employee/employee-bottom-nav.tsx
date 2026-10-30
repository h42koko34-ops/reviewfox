// File: components/employee/employee-bottom-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { History, PlusCircle, Trophy } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { toast } from 'sonner';

export function EmployeeBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const items = [
    { href: '/employee', label: t.employee.nav.newClaim, icon: PlusCircle },
    { href: '/employee/history', label: t.employee.nav.history, icon: History },
    { href: '/employee/leaderboard', label: t.employee.nav.leaderboard, icon: Trophy },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/20 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 px-4 py-1.5"
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault();
                  toast(t.employee.newClaimForm.toastSuccess);
                }
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="employee-nav-pill"
                  className="absolute inset-0 rounded-xl bg-orange-500/10"
                  transition={{ type: 'spring', duration: 0.4 }}
                />
              )}
              <item.icon className={`relative h-5 w-5 ${isActive ? 'text-orange-500' : 'text-zinc-400'}`} />
              <span className={`relative text-[10px] font-semibold ${isActive ? 'text-orange-500' : 'text-zinc-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}