/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B1B1B",
        jade: "#E7F3EF",
        mist: "#F6F7F9",
      }
    }
  },
  plugins: [],
};