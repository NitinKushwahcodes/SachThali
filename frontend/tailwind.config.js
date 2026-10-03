// Tailwind CSS styling configuration file for Sachthali frontend design system.
// Extends color palette with brand background #FAF7F2, primary green #3F8F5F, and verdict colors.
// Scans src directory JSX files for utility class extraction.

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          light: '#FAF7F2',
          dark: '#111815',
        },
        primary: {
          DEFAULT: '#3F8F5F',
          hover: '#34774E',
        },
        accent: {
          amber: '#E08A3E',
        },
        verdict: {
          under: '#3F8F5F',
          ontrack: '#4A6572',
          over: '#E08A3E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
