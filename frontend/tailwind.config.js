import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#1814F3",
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#1814F3",
          600: "#1210cc",
          700: "#0e0da8",
          foreground: "#ffffff",
        },
        sidebar: "#343c6a",
        "sidebar-muted": "#8BA3CB",
        teal: "#16dbcc",
        surface: "#F5F7FA",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#1814F3",
              foreground: "#ffffff",
            },
            focus: "#1814F3",
          },
        },
      },
    }),
  ],
};
