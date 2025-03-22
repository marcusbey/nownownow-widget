/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'text-spin': 'text-spin 60s linear infinite',
        'text-spin-fast': 'text-spin 5s linear infinite',
        'text-spin-medium': 'text-spin 30s linear infinite',
        'text-hover': 'text-hover 2s ease-in-out infinite',
        'arrow-bounce': 'arrow-bounce 1s infinite',
      },
      keyframes: {
        'text-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'text-hover': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'arrow-bounce': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(3px)' },
        },
      },
      zIndex: {
        'max': '2147483647',
      },
      transitionProperty: {
        'text-ring': 'animation-duration',
      },
      transitionDuration: {
        '400': '400ms',
      },
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
