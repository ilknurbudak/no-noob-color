import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png", "logo-lockup.png", "drop-arrow.png"],
      manifest: {
        name: "no noob color",
        short_name: "noni color",
        description: "Color palette tool — extract, generate, organize. Persona-aware.",
        theme_color: "#0a0a0a",
        background_color: "#fafafa",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/logo.png", sizes: "192x192", type: "image/png" },
          { src: "/logo.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallbackDenylist: [/^\/api/, /^\/share/],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/(?:localhost|127\.0\.0\.1):8000\//,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https?:\/\/(?:localhost|127\.0\.0\.1):8090\//,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Forward /api requests to the FastAPI service during dev
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
