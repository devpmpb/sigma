import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    // Habilitar pré-processamento CSS
    postcss: "./postcss.config.js",
  },
  server: {
    // Ajuste isso caso queira usar uma porta diferente
    port: 3000,
    // Abre o navegador automaticamente quando inicia
    open: true,
  },
  // Garantir que importações de CSS funcionem corretamente
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".css"],
  },
});
