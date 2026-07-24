/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#080a0f',
        'dark-surface': '#0d1118',
        'dark-card': 'rgba(17, 21, 30, 0.88)',
        'dark-card-hover': 'rgba(21, 26, 38, 0.96)',
        'brand-accent': '#78d8d0',
        'brand-purple': '#8aa4ff',
      },
    },
  },
  plugins: [],
};
