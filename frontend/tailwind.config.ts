import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#0f172a',
          800: '#1e3a8a',
          600: '#2563eb',
          500: '#3b82f6',
        },
        accent: {
          500: '#6366f1',
        },
        soft: {
          100: '#f8fafc',
          200: '#eef2ff',
        },
      },
      boxShadow: {
        glass: '0 10px 35px rgba(15, 23, 42, 0.12)',
        soft: '0 8px 24px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        fadeInUp: 'fadeInUp 500ms ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
