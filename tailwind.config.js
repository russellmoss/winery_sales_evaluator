/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'gray-50': '#F5F5F5',
        'gray-800': '#2C1810',
      },
    },
  },
  plugins: [],
} 