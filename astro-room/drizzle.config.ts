import {defineConfig} from "drizzle-kit";


export default defineConfig({
  dialect: "sqlite",
  dbCredentials: {
    url: "data/info.db"
  },
  schema: "./drizzle/schema.ts",
  out: "./drizzle-migrations"
})