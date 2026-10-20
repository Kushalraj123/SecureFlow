/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#080D18',
        card: '#111827',
        'card-secondary': '#172033',
        border: '#263449',
        cyan: {
          400: '#00E5FF',
          500: '#00cde6',
          DEFAULT: '#00E5FF',
        },
        electric: '#3B82F6',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        'primary-text': '#F8FAFC',
        'secondary-text': '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-cyan': 'glowCyan 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glowCyan: {
          '0%': { boxShadow: '0 0 5px rgba(0, 229, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)' },
        },
      },
    },
  },
  plugins: [],
};
