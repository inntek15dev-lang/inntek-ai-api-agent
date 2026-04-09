/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./main.js"
  ],
  theme: {
    extend: {
      colors: {
        azul1: '#1F4E79',
        azul2: '#2E75B6',
        azul3: '#5B9BD5',
        verde1: '#375623',
        verde2: '#70AD47',
        morado: '#7030A0',
        surface: '#0f0f1a',
        surface2: '#181828',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
