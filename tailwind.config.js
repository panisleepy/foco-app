/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      colors: {
        foco: {
          green: "#2D3A2D",
          surface: "rgba(255, 255, 255, 0.4)",
        },
      },
      animation: {
        shimmer: "shimmer 0.9s ease-out forwards",
        sparkle: "sparkle 0.65s ease-out forwards",
      },
      keyframes: {
        shimmer: {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "35%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(1.02)" },
        },
        sparkle: {
          "0%": { opacity: "0" },
          "20%": { opacity: "0.85" },
          "100%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
