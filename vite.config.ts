import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  base: "/deckgl-editor-example/",
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      plugins: [visualizer()],
      output: {
        manualChunks: {
          deckgl_core: ["@deck.gl/core"],
          deckgl_other: [
            "@deck.gl/layers",
            "@deck.gl/geo-layers",
            "@deck.gl/react",
            "@deck.gl-community/editable-layers",
          ],
        },
      },
    },
  },
});
