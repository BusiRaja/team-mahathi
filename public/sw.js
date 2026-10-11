// Service worker for web-push notifications.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { title: event.data && event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(d.title || "Team Mahathi", {
      body: d.body || "",
      icon: "/logo.png",
      badge: "/logo.png",
      data: { url: d.url || "/" },
      tag: d.tag,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if ("focus" in c && c.url === url) return c.focus();
      return self.clients.openWindow(url);
    })
  );
});
