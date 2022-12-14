import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/a-canvas-in-different-framework",
  build: {
    rollupOptions: {
      output: {
        format: "iife",
      },
    },
  },
});
