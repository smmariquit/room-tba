// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import svelte from "@astrojs/svelte";
import AstroPWA from "@vite-pwa/astro";
// https://astro.build/config
export default defineConfig({
  integrations: [react(), svelte(), AstroPWA({
    registerType: "prompt",
  })],
});
