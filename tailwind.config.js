/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/renderer/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'editor-bg': '#1e1e1e',
        'editor-text': '#d4d4d4',
        'editor-selection': '#264f78',
        'editor-line-numbers': '#858585',
      },
    },
  },
  plugins: [],
} 