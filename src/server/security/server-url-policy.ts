import { AppError } from "@/src/server/api/errors";
import { sourceAllowsPrivateUrls } from "@/src/config/env";

const SAFE_SOURCE_PROTOCOLS = new Set(["http:", "https:"]);

function parseIpv4(hostname: string) {
  const parts = hostname.split(".");
  if (parts.length !== 4) {
    return null;
  }
  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return Number.NaN;
    }
    return Number(part);
  });
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }
  return octets as [number, number, number, number];
}

function isBlockedIpv4(hostname: string) {
  const octets = parseIpv4(hostname);
  if (!octets) {
    return false;
  }
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function parseMappedIpv4(hostname: string) {
  const mapped = hostname.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (!mapped) {
    return null;
  }
  const high = Number.parseInt(mapped[1] || "", 16);
  const low = Number.parseInt(mapped[2] || "", 16);
  if (!Number.isFinite(high) || !Number.isFinite(low)) {
    return null;
  }
  return [
    (high >> 8) & 255,
    high & 255,
    (low >> 8) & 255,
    low & 255,
  ].join(".");
}

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
}

function isBlockedIpv6(hostname: string) {
  if (hostname.startsWith("::ffff:")) {
    return isBlockedIpv4(hostname.slice("::ffff:".length)) || isBlockedIpv4(parseMappedIpv4(hostname) || "");
  }
  return (
    hostname === "::" ||
    hostname === "::1" ||
    hostname.startsWith("fe80:") ||
    hostname.startsWith("fc") ||
    hostname.startsWith("fd")
  );
}

function isBlockedHostname(hostname: string) {
  const normalized = normalizeHostname(hostname);
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "0" ||
    isBlockedIpv4(normalized) ||
    (normalized.includes(":") && isBlockedIpv6(normalized))
  );
}

export function parseSourceUrl(url: string) {
  try {
    return new URL(url);
  } catch {
    throw new AppError(400, "invalid_source_url", "Source URL must be a valid URL.");
  }
}

export function assertSafeSourceUrl(url: string) {
  const parsed = parseSourceUrl(url);
  if (!SAFE_SOURCE_PROTOCOLS.has(parsed.protocol)) {
    throw new AppError(400, "invalid_source_url", "Source URL must use http or https.");
  }
  if (!sourceAllowsPrivateUrls() && isBlockedHostname(parsed.hostname)) {
    throw new AppError(400, "invalid_source_url", "Source URL cannot target local, private, or reserved network addresses.");
  }
  return parsed;
}

export function resolveSafeRedirectUrl(location: string, currentUrl: string) {
  let redirected: URL;
  try {
    redirected = new URL(location, currentUrl);
  } catch {
    throw new AppError(400, "invalid_source_url", "Source redirect URL must be valid.");
  }
  assertSafeSourceUrl(redirected.toString());
  return redirected.toString();
}
