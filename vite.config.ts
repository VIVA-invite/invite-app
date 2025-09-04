import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // allow imports like "@/features/..." and "@/app/utils/..."
      "@": path.resolve(__dirname, "src"),
      // allow imports like "src/app/utils/..." (since you already use this style)
      "src": path.resolve(__dirname, "src")
    }
  }
});
