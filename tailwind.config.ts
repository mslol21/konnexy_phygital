import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      colors: {
        brand: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          muted: 'var(--primary-muted)'
        },
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
          glass: 'var(--surface-glass)'
        },
        'color-1': 'hsl(var(--color-1))',
        'color-2': 'hsl(var(--color-2))',
        'color-3': 'hsl(var(--color-3))',
        'color-4': 'hsl(var(--color-4))',
        'color-5': 'hsl(var(--color-5))'
      },
      boxShadow: {
        'glass-sm': '0 2px 10px -2px rgba(0, 0, 0, 0.05), 0 1px 0 0 rgba(255, 255, 255, 0.08) inset',
        'glass-md': '0 12px 32px -8px rgba(0, 0, 0, 0.14), 0 1px 0 0 rgba(255, 255, 255, 0.1) inset',
        'brand-glow': '0 0 36px -6px var(--primary)'
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.82', transform: 'scale(0.98)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        rainbow: {
          '0%': { 'background-position': '0%' },
          '100%': { 'background-position': '200%' }
        },
        'background-position-spin': {
          '0%': { backgroundPosition: 'top center' },
          '100%': { backgroundPosition: 'bottom center' }
        },
        'warp-beam': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '15%': { opacity: '1' },
          '85%': { opacity: '1' },
          '100%': { transform: 'translateY(-120%)', opacity: '0' }
        }
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        rainbow: 'rainbow var(--speed, 2s) infinite linear',
        'background-position-spin': 'background-position-spin 3000ms infinite alternate',
        'warp-beam': 'warp-beam var(--beam-duration, 4s) linear infinite'
      }
    }
  },
  plugins: []
};

export default config;
