/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F2F1F1",
        surface:    "#FFFFFF",
        soft:       "#F1F1F1",
        border:     "#E8E8E8",
        text:       "#090A0F",
        muted:      "#555555",
        primary: {
          DEFAULT: "#C4781B",
          50:  "#FEF3E7",
          100: "#FDE4C4",
          200: "#FAC98A",
          300: "#F7AD50",
          400: "#F09226",
          500: "#C4781B",
          600: "#A0610F",
          700: "#7C4A0A",
          800: "#583305",
          900: "#341D01",
        },
        accent:      "#C4771A",
        warning:     "#C3771B",
        danger:      "#E05252",
        success:     "#22C55E",
        successText: "#090A0F",
        warningText: "#FFFFFF",
        dangerText:  "#FFFFFF",
      },
      fontFamily: {
        sans:    ['Poppins', 'sans-serif'],
        display: ['Montserrat', 'serif'],
        mono:    ['Poppins', 'monospace'],
      },
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'card':  '0 2px 16px 0 rgba(9,10,15,0.07)',
        'card-hover': '0 8px 32px 0 rgba(196,120,27,0.13)',
        'primary': '0 4px 20px 0 rgba(196,120,27,0.35)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease both',
        'slide-up':   'slideUp 0.4s ease both',
        'slide-down': 'slideDown 0.3s ease both',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },              to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
}
