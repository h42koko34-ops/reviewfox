// File: app/providers.tsx
'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { LanguageProvider } from '@/lib/i18n/language-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <LanguageProvider>
        {children}
        <Toaster richColors position="top-center" />
      </LanguageProvider>
    </ThemeProvider>
  );
}