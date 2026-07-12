import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta oficial GOOD MINT: azul e branco (sem roxo) — seção 2 da spec
        gm: {
          50: "#f0f6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#5b9bf0",
          400: "#3b82f6",
          500: "#1e63c4",
          600: "#1750a3",
          700: "#103a6b",
          800: "#0d2c4d",
          900: "#0a2540",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
