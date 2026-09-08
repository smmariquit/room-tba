// @ts-check
import { defineConfig, envField } from "astro/config";
import svelte from "@astrojs/svelte";
import AstroPWA from "@vite-pwa/astro";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";
import {
  MESSENGER_CONTRIBUTE_TARGET,
  MESSENGER_MAINTAIN_TARGET,
} from "./src/constants/community-links.ts";
import { campusCommunity, campusSite } from "./src/campus.config.ts";

import tailwindcss from "@tailwindcss/vite";

/** Local E2E + integration preview — Vercel adapter does not support `astro preview`. */
const e2eNodeAdapter = process.env.ASTRO_E2E_NODE === "1";

// https://astro.build/config
export default defineConfig({
  site: campusSite.url,

  // Astro's HTML compressor drops the newline+indent that prettier inserts
  // after a closing inline tag, welding words together in prose: "activity
  // type(LEC" instead of "activity type (LEC". The saved bytes are not worth
  // corrupting the wiki and FAQ copy.
  compressHTML: false,

  integrations: [
    svelte(),
    AstroPWA({
      // "prompt" instead of "autoUpdate": an auto-updating worker seizes
      // control of already-open pages mid-boot, their old hashed chunks miss
      // the new precache, the fetches 404, and every cached visitor sees the
      // boot error after each deploy. With "prompt" the old worker keeps
      // serving its own consistent bundle until the user applies the update
      // (StatusBar listens for pwa:need-refresh, wired in src/pwa.ts).
      registerType: "prompt",
      workbox: {
        // AppRoot includes map + editor + PGlite; auth/proposals pushed it past 2 MiB.
        // pglite's wasm (10MB) and data (6MB) must fit: they are the boot
        // path, and an install without them refetches from the network,
        // where any newer deploy 404s the old hashes and boot dies (the
        // "Room TBA did not finish loading" card).
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        // The Vercel adapter otherwise points globDirectory at dist/server,
        // so nothing client-side gets precached and the app can't load
        // offline. Glob the actual client output instead.
        globDirectory: "dist/client",
        // Precache app assets plus the home shell (only the root index.html,
        // not the ~650 entity SEO pages) so the app loads offline. The
        // navigate fallback serves that shell for offline navigations.
        globPatterns: [
          "**/*.{js,css,ico,png,svg,webmanifest,json,jpg,wasm,data}",
          "index.html",
          "privacy/index.html",
          "terms/index.html",
          "faq/index.html",
          "changelog/index.html",
          "sponsors/index.html",
          "donate/index.html",
          "wiki/emergency-hotlines/index.html",
          "wiki/campus-curfew/index.html",
        ],
        // #716: desktop-only.css is never fetched by mobile viewports at
        // runtime — don't undo that by precaching it into every install
        // (including mobile) regardless of device. Cache it on-demand
        // instead, via the runtimeCaching rule below.
        globIgnores: ["**/desktop-only*"],
        navigateFallback: "/",
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/privacy(\/|\?|$)/,
          /^\/terms(\/|\?|$)/,
          /^\/faq(\/|\?|$)/,
          /^\/changelog(\/|\?|$)/,
          /^\/sponsors(\/|\?|$)/,
          /^\/donate(\/|\?|$)/,
          /^\/transparency(\/|\?|$)/,
          /^\/wiki(\/|\?|$)/,
          // Server-rendered per pair; the offline app shell would replace the
          // directions with an empty map.
          /^\/route(\/|\?|$)/,
          // /planner is its own page; without this the nav fallback serves the
          // map shell and the planner never opens for returning (SW-cached)
          // users. The `\?` matters: workbox matches denylist against
          // pathname+search, so /planner?term=… must be covered too (#planner).
          // Network-first; the in-app planner button covers offline.
          /^\/planner(\/|\?|$)/,
          /^\/final-exams(\/|\?|$)/,
          /^\/calendar(\/|\?|$)/,
          /^\/today(\/|\?|$)/,
          // Server redirects — must hit network, not offline app shell (#471).
          /^\/messenger(\/|\?|$)/,
          /^\/maintain(\/|\?|$)/,
          /^\/discord(\/|\?|$)/,
        ],
        swDest: "dist/client/sw.js",
        // Cache third-party map resources at runtime so the campus map works
        // offline once visited (or after an explicit "download offline maps").
        runtimeCaching: [
          {
            // #716: desktop-only.css, excluded from precache above so mobile
            // installs never fetch it — cached the first time a desktop
            // viewport actually requests it, so repeat offline visits still work.
            urlPattern: /\/desktop-only.*\.css$/,
            handler: "CacheFirst",
            options: {
              cacheName: "desktop-only-css",
              expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // #866: PGlite ships ~5 MB of wasm + data. Too big to precache
            // (that would download Postgres during service worker install),
            // but content-hashed, so CacheFirst is safe — a new build emits a
            // new filename and never hits this entry. As with the navigate
            // denylist above, the pattern must tolerate a `?` suffix: workbox
            // matches the full URL, so a `$` anchor alone would miss.
            urlPattern: /\/_astro\/(pglite|initdb)\.[^/?]*\.(wasm|data)(\?|$)/,
            handler: "CacheFirst",
            options: {
              cacheName: "pglite-wasm",
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24 * 365,
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // MapTiler vector tiles + tiles.json
            urlPattern: /^https:\/\/api\.maptiler\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: {
                maxEntries: 4000,
                maxAgeSeconds: 60 * 60 * 24 * 30,
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Sprites, glyphs, and shaded-relief rasters used by the map style
            urlPattern:
              /^https:\/\/(maputnik|orangemug|klokantech)\.github\.io\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "map-assets",
              expiration: {
                maxEntries: 800,
                maxAgeSeconds: 60 * 60 * 24 * 30,
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "Room TBA",
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
        display_override: ["standalone"],
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

    optimizeDeps: {
      exclude: ["@electric-sql/pglite"],
    },

    plugins: [tailwindcss()],
  },

  redirects: {
    "/contribute": "/?contribute=1",
    // The money report moved to the org site; keep both old paths alive.
    "/wiki/transparency": "https://www.uplb.tools/transparency",
    "/transparency": "https://www.uplb.tools/transparency",
    "/discord": campusCommunity.discordUrl,
    "/messenger": MESSENGER_CONTRIBUTE_TARGET,
    "/messenger/contribute": MESSENGER_CONTRIBUTE_TARGET,
    "/messenger/maintain": MESSENGER_MAINTAIN_TARGET,
    "/maintain": MESSENGER_MAINTAIN_TARGET,
  },

  // adapter: vercel(),
  env: {
    schema: {
      // Supabase Postgres connection string (Session pooler or direct).
      DATABASE_URL: envField.string({
        access: "secret",
        context: "server",
      }),
      // Public Kubo integration directory. Override locally for fixture/API testing.
      KUBO_ROOM_TBA_DIRECTORY_URL: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      // Supabase JS client (Auth, Realtime, Storage). Separate from DATABASE_URL.
      PUBLIC_SUPABASE_URL: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      PUBLIC_SUPABASE_PUBLISHABLE_KEY: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      PUBLIC_MAPTILER_KEY: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      // Street View imagery beside a building pin. Optional: with no key the
      // feature is off rather than broken. Public by necessity, the browser
      // requests the images, so restrict it by HTTP referrer.
      PUBLIC_GOOGLE_MAPS_API_KEY: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      // staging | production — drives the staging environment banner (#289).
      PUBLIC_APP_ENV: envField.string({
        access: "public",
        context: "client",
        optional: true,
        default: "production",
      }),
      ADMIN_PASSWORD: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      // PayMongo secret key for one-time donations (/api/donate).
      PAYMONGO_SECRET_KEY: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      ADMIN_SESSION_SECRET: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      // Cloudflare R2 (S3-compatible). Required for /api/admin/upload.
      R2_ACCOUNT_ID: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      R2_ACCESS_KEY_ID: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      R2_SECRET_ACCESS_KEY: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      R2_BUCKET_NAME: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      // Public base URL for uploaded objects (custom domain or r2.dev).
      R2_PUBLIC_URL: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      NOTIFICATION_GATEWAY_URL: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      NOTIFICATION_INGRESS_SECRET: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      // Resend (editor email digests, #272). Digest is skipped when unset.
      RESEND_API_KEY: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      // From address, e.g. "Room TBA <digest@uplbtools.me>".
      RESEND_FROM_EMAIL: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      // Rewrites computed walking directions into prose on /route/*. Optional:
      // unset, the route page ships the deterministic description instead, so
      // local dev and forks work without an AI account.
      ANTHROPIC_API_KEY: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      // Vercel injects CRON_SECRET; /api/cron/* requires it as a Bearer token.
      CRON_SECRET: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      // Cloudflare Turnstile on editor login (#443). Widget is hidden and
      // server verification skipped when unset (local dev).
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      TURNSTILE_SECRET_KEY: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      // Datadog RUM (client) + server observability (#495). RUM tokens are
      // public by design; omit locally to disable.
      DD_RUM_APPLICATION_ID: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      DD_RUM_CLIENT_TOKEN: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      DD_SITE: envField.string({
        access: "public",
        context: "client",
        optional: true,
        default: "us5.datadoghq.com",
      }),
      DD_SERVICE: envField.string({
        access: "public",
        context: "client",
        optional: true,
        default: "room-tba",
      }),
      DD_ENV: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      DD_VERSION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      DD_API_KEY: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      DD_OTLP_ENDPOINT: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
    },
  },
  adapter: e2eNodeAdapter
    ? node({ mode: "standalone" })
    : vercel({
        // Old clients keep resolving their own deployment's hashed assets
        // (?dpl= pinning) instead of 404ing after every release. Second
        // layer of the boot-failure fix; the first is precaching pglite.
        skewProtection: true,
        // Entity SEO pages use prerender=false and render on first request; Vercel
        // caches HTML at the edge (ISR). Admin writes revalidate via ISR_BYPASS_TOKEN.
        isr: {
          expiration: 60 * 60 * 24,
          bypassToken: process.env.ISR_BYPASS_TOKEN,
          // /og.png must stay a plain function: Vercel ISR keys its cache on
          // pathname only, so ?t=/&s=/&k= variants all collapse into one cached
          // PNG and every entity shares the first-rendered card (#651). The
          // normal CDN cache (via the route's s-maxage) keys on the full URL.
          exclude: [/^\/api\//, /^\/og\.png$/],
        },
      }),
});
