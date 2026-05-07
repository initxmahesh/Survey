/** @type {import('tailwindcss').Config} */
import lineClamp from "@tailwindcss/line-clamp";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        serif: ["DM Serif Display", "serif"],
      },
      colors: {
        accent: { DEFAULT: "#2563EB", light: "#EFF6FF", hover: "#1D4ED8" },
        surface: "#F4F3F0",
        "border-default": "#E8E6E0",
      },
      borderRadius: {
        "2xl": "14px",
        "3xl": "20px",
      },
    },
  },
  plugins: [lineClamp],
}

