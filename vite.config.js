import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      /* ── Registration strategy ─────────────────────────── */
      registerType: "prompt",           // We control when SW is updated (via our hook)
      injectRegister: "script",         // Inject registration script automatically

      /* ── Dev mode: also enable in development for testing ─ */
      devOptions: {
        enabled: false,                 // Keep false in dev to avoid confusion
        type: "module",
      },

      /* ── Web App Manifest ─────────────────────────────── */
      manifest: {
        name: "Pg Dhundo — Find PG, Rooms & Flats",
        short_name: "Pg Dhundo",
        description:
          "Discover verified PGs, rooms, flats and hotel stays near MAKAUT, Kolkata and surrounding areas. Zero brokerage. Direct owner contact.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#eefaf4",
        theme_color: "#22577A",
        lang: "en",
        categories: ["lifestyle", "travel", "utilities"],
        icons: [
          {
            src: "/icons/icon-72x72.png",
            sizes: "72x72",
            type: "image/png",
          },
          {
            src: "/icons/icon-96x96.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "/icons/icon-128x128.png",
            sizes: "128x128",
            type: "image/png",
          },
          {
            src: "/icons/icon-144x144.png",
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "/icons/icon-152x152.png",
            sizes: "152x152",
            type: "image/png",
          },
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-384x384.png",
            sizes: "384x384",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "/screenshots/mobile-home.png",
            sizes: "390x844",
            type: "image/png",
            form_factor: "narrow",
            label: "Home — Browse PGs and Rooms",
          },
        ],
        shortcuts: [
          {
            name: "Browse PGs & Rooms",
            short_name: "PGs",
            description: "Find PGs and rooms near you",
            url: "/?type=pgroom",
            icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }],
          },
          {
            name: "Browse Flats",
            short_name: "Flats",
            description: "Find flats for rent or sale",
            url: "/?type=flat",
            icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }],
          },
          {
            name: "Saved Properties",
            short_name: "Saved",
            description: "View your saved stays",
            url: "/saved",
            icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }],
          },
        ],
      },

      /* ── Workbox service worker configuration ───────────── */
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp}"],

        // Don't cache admin routes — they need fresh data
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/admin/, /^\/api/],

        runtimeCaching: [
          /* Google Fonts stylesheets */
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          /* Google Fonts webfonts */
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          /* Supabase storage images — cache with network fallback */
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 10,
            },
          },
          /* Supabase REST API — always try network, fall back to cache */
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 8,
            },
          },
          /* Leaflet map tiles */
          {
            urlPattern: /^https:\/\/(a|b|c)\.tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],

  server: {
    port: 5173,
    open: false,
  },

  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
