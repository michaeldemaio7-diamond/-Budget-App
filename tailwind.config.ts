import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d6fe",
          300: "#a5b9fc",
          400: "#8193f8",
          500: "#6270f1",
          600: "#4d52e5",
          700: "#3f41ca",
          800: "#3537a3",
          900: "#1e2045",
          950: "#141628",
        },
      },
    },
  },
  plugins: [],
};
export default config;
