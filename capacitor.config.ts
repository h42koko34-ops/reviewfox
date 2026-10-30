// File: capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.reviewfox.app',
  appName: 'ReviewFox',
  webDir: 'public',
  // Capacitor wraps the LIVE hosted PWA in a native WebView shell — this is
  // the standard, low-maintenance approach for shipping a Next.js SSR app
  // (which cannot be fully static-exported) to the app stores.
  server: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://app.reviewfox.com',
    cleartext: false,
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;