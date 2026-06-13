import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import wails from "@wailsio/runtime/plugins/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    // Preserves the dynamic environment ports Wails passes down
    port: Number(process.env.WAILS_VITE_PORT) || 9245,
    strictPort: true,
  },
  plugins: [
    // Router plugin has to go before react plugin
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    wails("./bindings"),
    tailwindcss(),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
