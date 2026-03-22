// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import svelte from "@astrojs/svelte";
import AstroPWA from "@vite-pwa/astro";
// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    svelte(),
    AstroPWA({
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,json,jpg}"],
      }
    }),
  ],
  vite: {
    preview: {
      host: "127.0.0.1"
    },
    server: {
      host: "localhost",
    }
  },
  redirects: {
    "/contribute": "https://forms.gle/nVUMuuZgfW1HgXc98"
  },
});