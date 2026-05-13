self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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
