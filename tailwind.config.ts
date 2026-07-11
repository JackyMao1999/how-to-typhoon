import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0e1a',
          surface: '#141a2e',
          'surface-light': '#1c2541',
        },
        typhoon: {
          lv7: '#4FC3F7',
          lv10: '#FFD54F',
          lv12: '#EF5350',
        },
      },
      fontFamily: {
        sans: ['HarmonyOS Sans SC', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
