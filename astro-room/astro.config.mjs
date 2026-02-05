// @ts-check
import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  env: {
    schema: {
      DATABASE_URL: envField.string({context: "server", access: "secret"})
    }
  }
});
