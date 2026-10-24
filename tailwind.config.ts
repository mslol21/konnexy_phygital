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
        }
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
        }
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2.5s linear infinite'
      }
    }
  },
  plugins: []
};

export default config;
