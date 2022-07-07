/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  theme: {
    extend: {
      screens: {
        "xs": "400px",
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
};
