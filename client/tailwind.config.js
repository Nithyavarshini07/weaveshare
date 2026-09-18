/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#2f8f9d',
          dark: '#0d3b46',
          cyan: '#eaf9ff',
          light: '#f6fbff',
          accent: '#1c7fa5',
        },
      },
      boxShadow: {
        soft: '0 12px 35px rgba(15, 48, 66, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
