import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta oficial GOOD MINT: azul e branco (sem roxo) — seção 2 da spec.
        // Cada tom lê de uma CSS var (RGB) definida em app/globals.css, que
        // troca de valor em [data-theme="dark"] — é assim que o modo escuro
        // funciona sem precisar de classes `dark:` espalhadas pelo app.
        gm: {
          50: "rgb(var(--gm-50) / <alpha-value>)",
          100: "rgb(var(--gm-100) / <alpha-value>)",
          200: "rgb(var(--gm-200) / <alpha-value>)",
          300: "rgb(var(--gm-300) / <alpha-value>)",
          400: "rgb(var(--gm-400) / <alpha-value>)",
          500: "rgb(var(--gm-500) / <alpha-value>)",
          600: "rgb(var(--gm-600) / <alpha-value>)",
          700: "rgb(var(--gm-700) / <alpha-value>)",
          800: "rgb(var(--gm-800) / <alpha-value>)",
          900: "rgb(var(--gm-900) / <alpha-value>)",
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
