/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3f51b5",
          light: "#757de8",
          dark: "#002984",
        },
      },
    },
  },
  plugins: [],
  // Garantir que o Tailwind não esteja em modo JIT que pode causar problemas
  mode: "jit",
  purge: {
    enabled: process.env.NODE_ENV === "production",
    content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  },
};
