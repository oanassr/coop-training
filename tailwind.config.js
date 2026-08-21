/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tajawal', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
      },
      colors: {
        // هوية جامعة الملك خالد - الأخضر الأساسي مع لمسة ذهبية
        kku: {
          50: '#eefaf1',
          100: '#d6f2df',
          200: '#aee5c1',
          300: '#79d19e',
          400: '#43b676',
          500: '#1f9a58',
          600: '#0f7d45', // الأخضر الأساسي
          700: '#0a6338',
          800: '#0a4f2f',
          900: '#084128',
          950: '#032516',
        },
        gold: {
          50: '#fbf7ec',
          100: '#f5eccf',
          200: '#ecd9a1',
          300: '#e0bf6a',
          400: '#d6a844',
          500: '#c69026', // الذهبي
          600: '#a9711e',
          700: '#87531c',
          800: '#71431e',
          900: '#61381e',
        },
        ink: {
          DEFAULT: '#0f172a',
          soft: '#334155',
          muted: '#64748b',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,0.06), 0 8px 24px -12px rgba(15,23,42,0.15)',
        glow: '0 0 0 1px rgba(15,125,69,0.15), 0 12px 32px -14px rgba(15,125,69,0.45)',
      },
      backgroundImage: {
        'kku-mesh':
          'radial-gradient(at 0% 0%, rgba(15,125,69,0.12) 0px, transparent 55%), radial-gradient(at 100% 0%, rgba(198,144,38,0.10) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(15,125,69,0.08) 0px, transparent 50%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}
