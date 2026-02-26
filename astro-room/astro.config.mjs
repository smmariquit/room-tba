// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import svelte from "@astrojs/svelte";
import { VitePWA } from "vite-plugin-pwa";
// https://astro.build/config
export default defineConfig({
  integrations: [react(), svelte()],
  vite: {
    plugins: [VitePWA({ registerType: "autoUpdate" })]
  }
});
