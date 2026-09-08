export function notifyContextChanged() {
  void fetch("/api/context/invalidate", { method: "POST" }).catch(() => undefined);
}
