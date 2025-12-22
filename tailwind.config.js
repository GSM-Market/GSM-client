/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F6F8FF',
          100: '#E8EDFF',
          200: '#D1DBFF',
          300: '#A8B8FF',
          400: '#7A95FF',
          500: '#4F7DFF', // 메인 파란색
          600: '#3D6AFF',
          700: '#2E55E6',
          800: '#2544CC',
          900: '#1E36A6',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      maxWidth: {
        'container': '1100px',
      },
    },
  },
  plugins: [],
}


