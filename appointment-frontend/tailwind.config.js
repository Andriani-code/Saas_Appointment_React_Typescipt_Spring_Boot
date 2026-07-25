/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFF8F1",
        surface:    "#F4EDE4",
        soft:       "#EAE0D5",
        border:     "#DCCFC2",
        text:       "#2E3133",
        muted:      "#6E7377",
        primary: {
          DEFAULT: "#C4771A",
          50:  "#FEF4E8",
          100: "#FDE9D1",
          200: "#FCD3A3",
          300: "#FABC75",
          400: "#F8A547",
          500: "#C4771A",
          600: "#A36316",
          700: "#824F12",
          800: "#623B0D",
          900: "#412709",
        },
        accent:      "#2F5D73",
        warning:     "#C3771B",
        danger:      "#E05252",
        success:     "#22C55E",
        successText: "#2E3133",
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
