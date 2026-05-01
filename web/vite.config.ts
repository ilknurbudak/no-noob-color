import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

// PWA temporarily disabled: in active development, the service worker
// cache was serving stale builds and breaking the dark-mode toggle +
// other CSS hot updates. Re-enable for production deploy.

export default defineConfig({
  plugins: [
    vue(),
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
