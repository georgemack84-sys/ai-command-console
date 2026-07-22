const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

export function toSafeUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return SAFE_PROTOCOLS.has(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}
