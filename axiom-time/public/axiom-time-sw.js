self.addEventListener("push", (event) => {
  const payload = event.data
    ? event.data.json()
    : { title: "Axiom Time", body: "A scheduled event needs attention." };
  event.waitUntil(
    self.registration.showNotification(payload.title || "Axiom Time", {
      body: payload.body,
      tag: payload.tag || "axiom-time",
      data: payload.data,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
