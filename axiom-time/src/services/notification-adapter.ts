"use client";

export type NotificationEnablement = "enabled" | "denied" | "unsupported";

export const enableNotifications =
  async (): Promise<NotificationEnablement> => {
    if (!("serviceWorker" in navigator) || !("Notification" in window))
      return "unsupported";
    await navigator.serviceWorker.register("/axiom-time-sw.js");
    const permission = await Notification.requestPermission();
    return permission === "granted" ? "enabled" : "denied";
  };

export const showTimeNotification = async (
  title: string,
  body: string,
): Promise<void> => {
  if (!("serviceWorker" in navigator) || Notification.permission !== "granted")
    return;
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    body,
    tag: `axiom-time-${title}`,
  });
};
