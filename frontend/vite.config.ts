import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/rails_models_viz/",
  build: {
    outDir: path.resolve(__dirname, "../public/rails_models_viz"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
  server: {
    port: 3100,
    proxy: {
      "/rails_models_viz/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
