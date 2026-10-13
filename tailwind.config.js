/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: {
    navy: { 900: "#0b1437", 800: "#111c4a", 700: "#1b2a63" },
    brand: { 50: "#f1efff", 500: "#6d5ef7", 600: "#5b4be6", 700: "#4a3cc7" },
  } } },
  plugins: [],
};
