const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Arial', ...fontFamily.sans],
      },
      colors: {
        'portal-dark': {
          DEFAULT: '#2c3e50',
          light: '#34495e',
        },
        'portal-blue': {
          DEFAULT: '#3498db',
          light: '#5dade2',
        },
        'portal-bg': {
          DEFAULT: '#f8f9fa',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
