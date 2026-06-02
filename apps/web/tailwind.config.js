/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Backgrounds ──────────────────────────────────────
        'bg-primary':   '#080808',
        'bg-secondary': '#0f0f0f',
        'bg-elevated':  '#141414',
        'bg-hover':     '#1e1e1e',

        // ── Brand violet ──────────────────────────────────────
        violet: {
          500:  '#b44fff',
          dim:  '#2a1040',
        },

        // ── Text ──────────────────────────────────────────────
        'text-primary':   '#e8e8e8',
        'text-secondary': '#888888',
        'text-muted':     '#444444',

        // ── Borders ───────────────────────────────────────────
        'border-default': '#1e1e1e',
        'border-focus':   '#b44fff',

        // ── Semantic ──────────────────────────────────────────
        success: '#10b981',
        warning: '#f59e0b',
        danger:  '#ef4444',
        info:    '#3b82f6',
      },

      fontFamily: {
        mono: ["'Share Tech Mono'", "'JetBrains Mono'", "'Courier New'", 'monospace'],
        display: ['Inter', 'sans-serif'],
      },

      fontSize: {
        '2xs': ['10px', { lineHeight: '1.4', letterSpacing: '0.1em' }],
        xs:    ['11px', { lineHeight: '1.5', letterSpacing: '0.08em' }],
        sm:    ['12px', { lineHeight: '1.6' }],
        base:  ['13px', { lineHeight: '1.7' }],
        md:    ['14px', { lineHeight: '1.7' }],
        lg:    ['16px', { lineHeight: '1.6' }],
        xl:    ['20px', { lineHeight: '1.4' }],
        '2xl': ['24px', { lineHeight: '1.3' }],
        '3xl': ['32px', { lineHeight: '1.2' }],
        '4xl': ['40px', { lineHeight: '1.1' }],
        '5xl': ['48px', { lineHeight: '1.1' }],
      },

      borderRadius: {
        none: '0px',
        // Only expose 'none' — Vybe design = NO border-radius on primary elements
        // Use inline styles for rare exceptions (avatars)
      },

      boxShadow: {
        'glow-violet': '0 0 20px rgba(180, 79, 255, 0.2)',
        'glow-violet-lg': '0 0 40px rgba(180, 79, 255, 0.35)',
        'glow-success': '0 0 16px rgba(16, 185, 129, 0.25)',
        'glow-danger': '0 0 16px rgba(239, 68, 68, 0.25)',
      },

      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'glitch-1': {
          '0%':   { transform: 'none', opacity: '0' },
          '5%':   { transform: 'skewX(-18deg) translateX(-5px)', opacity: '0.9' },
          '6%':   { transform: 'none', opacity: '0' },
          '25%':  { transform: 'none', opacity: '0' },
          '27%':  { transform: 'skewX(10deg) translateX(4px)', opacity: '0.7' },
          '28%':  { transform: 'none', opacity: '0' },
          '100%': { transform: 'none', opacity: '0' },
        },
        'glitch-2': {
          '0%':   { transform: 'none', opacity: '0' },
          '5%':   { transform: 'skewX(14deg) translateX(5px)', opacity: '0.8' },
          '6%':   { transform: 'none', opacity: '0' },
          '25%':  { transform: 'none', opacity: '0' },
          '27%':  { transform: 'skewX(-10deg) translateX(-4px)', opacity: '0.6' },
          '28%':  { transform: 'none', opacity: '0' },
          '100%': { transform: 'none', opacity: '0' },
        },
        'scroll-ticker': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(-100%)' },
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-violet': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(180, 79, 255, 0.2)' },
          '50%':      { boxShadow: '0 0 24px rgba(180, 79, 255, 0.5)' },
        },
      },

      animation: {
        blink:         'blink 1s step-end infinite',
        'glitch-1':    'glitch-1 6s infinite',
        'glitch-2':    'glitch-2 6s infinite reverse',
        'ticker':      'scroll-ticker 30s linear infinite',
        'fade-in':     'fade-in 0.2s ease-out',
        'pulse-violet':'pulse-violet 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
