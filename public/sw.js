const STATIC_CACHE = "prayer-streak-static-v2";
const PAGE_CACHE = "prayer-streak-pages-v2";
const OFFLINE_URL = "/offline.html";
const STATIC_ASSETS = [
  OFFLINE_URL,
  "/css/output.css",
  "/js/main.js",
  "/assets/prayer-streak-logo.svg",
];

function isCacheableResponse(response) {
  return Boolean(response && response.ok && response.type === "basic");
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => null)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![STATIC_CACHE, PAGE_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isSameOrigin && isCacheableResponse(response)) {
            const copy = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy)).catch(() => null);
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  if (isSameOrigin && ["style", "script", "image", "font"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (isCacheableResponse(response)) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)).catch(() => null);
            }
            return response;
          })
          .catch(() => null);

        if (cached) {
          networkFetch.catch(() => null);
          return cached;
        }

        return networkFetch.then((response) => response || caches.match(OFFLINE_URL));
      })
    );
  }
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "Prayer Streak",
    body: "Ada pengingat baru untukmu.",
    url: "/dashboard",
    tag: "prayer-streak-notification",
  };

  if (event.data) {
    try {
      payload = {
        ...payload,
        ...event.data.json(),
      };
    } catch {}
  }

  const options = {
    body: payload.body,
    icon: "/assets/prayer-streak-logo.svg",
    badge: "/assets/prayer-streak-logo.svg",
    tag: payload.tag,
    data: {
      url: payload.url || "/dashboard",
    },
    renotify: true,
    requireInteraction: true,
    timestamp: Date.now(),
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client && client.url.includes(targetUrl)) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return null;
    })
  );
});
