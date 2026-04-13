// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import svelte from "@astrojs/svelte";
import AstroPWA from "@vite-pwa/astro";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://room-tba.stimmie.dev/",
  integrations: [
    react(),
    svelte(),
    sitemap(),
    AstroPWA({
      workbox: {
        globPatterns: ["**/*.{js,css,ico,png,svg,webmanifest,json,jpg}"],
        globIgnores: ["room/**/*", "building/**/*"],
        navigateFallbackDenylist: [/^\/room/, /^\/building/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "pages",
            },
          },
        ],
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "Room TBA - Finally Answered",
        short_name: "Room TBA",
        description:
          "An open-source website built to help UPLB students find their rooms across the Los Baños campus",
        theme_color: "#a30e00",
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
        ],
      },
    }),
  ],
  vite: {
    preview: {
      host: "127.0.0.1",
    },
    server: {
      host: "localhost",
    },
  },
  redirects: {
    "/contribute": "https://forms.gle/nVUMuuZgfW1HgXc98",
  },
});
