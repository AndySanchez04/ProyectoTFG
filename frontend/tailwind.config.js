/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mostaza: {
          DEFAULT: '#EAB308', // Tailwind yellow-500
          hover: '#CA8A04', // Tailwind yellow-600
          light: '#FEF08A' // Tailwind yellow-200
        },
        fondo: {
          DEFAULT: '#000000',
          tarjeta: '#18181b', // zinc-900
          borde: '#27272a' // zinc-800
        }
      }
    },
  },
  plugins: [],
}
