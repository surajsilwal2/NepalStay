/**
 * NepalStay Service Worker
 * Enables offline access for booked hotel info and app shell.
 * Registered from app/layout.tsx via a script tag.
 *
 * Cache strategy:
 * - App shell (HTML, CSS, JS) → Cache First
 * - Hotel pages → Stale While Revalidate (show cached, update in background)
 * - API calls → Network First (try fresh, fall back to cache)
 * - Images → Cache First with 7-day expiry
 */

const CACHE_NAME = "nepalstay-v1";
const APP_SHELL = [
  "/",
  "/hotels",
  "/offline",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// Install — cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching app shell");
      return cache.addAll(APP_SHELL);
    }),
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch — intercept requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, and socket requests
  if (request.method !== "GET" || url.protocol === "chrome-extension:") return;

  // API calls → Network first, cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful GET API responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Images → Cache first, network fallback
  if (request.destination === "image") {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // HTML pages → Stale while revalidate
  if (request.destination === "document") {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => {
            // Offline fallback page
            return caches.match("/offline");
          });

        return cached || fetchPromise;
      }),
    );
    return;
  }

  // Everything else → Network first
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
