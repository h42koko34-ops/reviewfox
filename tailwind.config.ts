// File: tailwind.config.ts
// Tailwind CSS v4 يتم تكوينه أولًا عبر CSS (انظر app/globals.css باستخدام @theme).
// هذا الملف يحتفظ فقط بإعدادات المحتوى والوضع الداكن التي لا تزال تُقرأ من JS.
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
};

export default config;