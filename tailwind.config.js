/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'Segoe UI', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        bg: {
          base:    '#0a0d14',
          surface: '#0d1117',
          card:    '#111827',
          hover:   '#151e2d',
        },
        border: {
          DEFAULT: '#1f2937',
          hover:   '#2d3f57',
        },
        brand: {
          blue:   '#3b82f6',
          purple: '#8b5cf6',
          green:  '#22c55e',
          amber:  '#f59e0b',
          red:    '#ef4444',
        },
        text: {
          primary:   '#e2e8f0',
          secondary: '#9ca3af',
          muted:     '#6b7280',
          dimmed:    '#4b5563',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        'gradient-card':  'linear-gradient(145deg, #111827 0%, #0f1623 100%)',
      },
      borderRadius: {
        card: '16px',
      },
      animation: {
        'pulse-dot': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':   'fadeIn 0.35s ease forwards',
        'slide-in':  'slideIn 0.3s ease forwards',
        spin: 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
