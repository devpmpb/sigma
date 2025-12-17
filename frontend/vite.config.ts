import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "SIGMA - Sistema de Gestão Municipal",
        short_name: "SIGMA",
        description: "Sistema Integrado de Gestão Municipal de Atividades - Pato Bragado/PR",
        theme_color: "#1e40af",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Cache de assets estáticos
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],

        // Estratégias de cache para runtime
        runtimeCaching: [
          {
            // API calls - Network First com fallback para cache
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            // Dashboard data - Network First com cache mais curto
            urlPattern: /^https?:\/\/.*\/api\/dashboard\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "dashboard-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutos
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Imagens - Cache First
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
              },
            },
          },
          {
            // Fontes - Cache First
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // Habilitar PWA em dev para teste
      },
    }),
  ],
  css: {
    postcss: "./postcss.config.js",
  },
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".css"],
  },
});
