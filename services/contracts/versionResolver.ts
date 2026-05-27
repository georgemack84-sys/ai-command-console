export function resolveRequestedApiVersion(input?: string | null) {
  const raw = String(input || "v1").trim().toLowerCase();
  if (!/^v\d+$/.test(raw)) {
    throw new Error("API_VERSION_UNSUPPORTED");
  }
  return raw;
}
