import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [TanStackRouterVite({ quoteStyle: "double" }), react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    port: 4001,
  },
});
