/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'welcome-bg': '#1a1040', // dark blue-purple 
        'welcome-accent': '#8A2BE2', // bright purple accent
      },
    },
  },
  plugins: [],
}