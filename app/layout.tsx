// File: app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Cairo, Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ReviewFox | AI-Powered Review Management',
  description: 'منصة إدارة ومطابقة التقييمات الذكية',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#07090e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${inter.variable} font-cairo dark`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-screen text-white antialiased selection:bg-orange-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}