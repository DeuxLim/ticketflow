import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f6f7f8',
        surface: '#ffffff',
        foreground: '#111111',
        muted: '#6b7280',
        border: '#e5e7eb',
        accent: '#0f172a',
      },
      boxShadow: {
        soft: '0 10px 30px -16px rgba(15, 23, 42, 0.25)',
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
