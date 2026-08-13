/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          400: 'rgb(var(--primary-400-rgb, 96 165 250) / <alpha-value>)',
          500: 'rgb(var(--primary-500-rgb, 59 130 246) / <alpha-value>)',
          600: 'rgb(var(--primary-600-rgb, 37 99 235) / <alpha-value>)',
          700: 'rgb(var(--primary-700-rgb, 30 64 175) / <alpha-value>)',
          800: 'rgb(var(--primary-800-rgb, 30 58 138) / <alpha-value>)',
        },
        surface: {
          300: 'rgb(var(--surface-300-rgb, 203 213 225) / <alpha-value>)',
          400: 'rgb(var(--surface-400-rgb, 148 163 184) / <alpha-value>)',
          500: 'rgb(var(--surface-500-rgb, 107 114 128) / <alpha-value>)',
          600: 'rgb(var(--surface-600-rgb, 75 85 99) / <alpha-value>)',
          650: 'rgb(var(--surface-650-rgb, 37 37 48) / <alpha-value>)',
          700: 'rgb(var(--surface-700-rgb, 26 26 31) / <alpha-value>)',
          800: 'rgb(var(--surface-800-rgb, 20 20 25) / <alpha-value>)',
          900: 'rgb(var(--surface-900-rgb, 15 15 20) / <alpha-value>)',
          950: 'rgb(var(--surface-950-rgb, 11 11 15) / <alpha-value>)',
        },
        accent: 'var(--accent, rgb(59 130 246))',
        'bg-base': 'var(--bg-base, rgb(11 11 15))',
        'bg-surface': 'var(--bg-surface, rgb(15 15 20))',
        'bg-elevated': 'var(--bg-elevated, rgb(20 20 25))',
        'bg-panel': 'var(--bg-panel, rgb(15 15 20))',
        'bg-input': 'var(--bg-input, rgb(11 11 15))',
        'text-heading': 'var(--text-heading, #f9fafb)',
        'text-body': 'var(--text-body, #d1d5db)',
        'text-muted': 'var(--text-muted, #9ca3af)',
        'text-subtle': 'var(--text-subtle, #6b7280)',
        'border-theme': 'var(--border-color, rgba(255,255,255,0.06))',
        'border-subtle': 'var(--border-subtle, rgba(255,255,255,0.04))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        theme: '0 8px 32px var(--shadow-color, rgba(0,0,0,0.35))',
        'theme-sm': '0 4px 16px var(--shadow-color, rgba(0,0,0,0.2))',
      },
    },
  },
  plugins: [],
};
