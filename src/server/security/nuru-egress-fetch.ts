import { AppError } from "@/src/server/api/errors";
import { env, nuruEgressProxyRequired } from "@/src/config/env";
import { assertResolvedPublicSourceUrl } from "@/src/server/security/server-url-policy";

export type NuruEgressFetchOptions = RequestInit & { maxBytes: number };

function assertProductionProxyConfigured() {
  if (!nuruEgressProxyRequired()) return;

  const proxyUrl = env.NURU_EGRESS_PROXY_URL;
  if (!proxyUrl) {
    throw new AppError(503, "egress_proxy_unavailable", "NSI retrieval requires the configured egress proxy.");
  }

  if (process.env.NODE_USE_ENV_PROXY !== "1" || process.env.HTTP_PROXY !== proxyUrl || process.env.HTTPS_PROXY !== proxyUrl) {
    throw new AppError(503, "egress_proxy_unavailable", "NSI retrieval proxy enforcement is not active.");
  }
}

/**
 * Single NSI network boundary. Deploy this module only in the egress worker
 * network policy; callers must handle redirects explicitly and re-enter here.
 */
export async function fetchFromNuruEgress(url: string, options: NuruEgressFetchOptions) {
  assertProductionProxyConfigured();
  await assertResolvedPublicSourceUrl(url);
  const response = await fetch(url, options);
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength && declaredLength > options.maxBytes) {
    throw new AppError(413, "source_payload_too_large", "Source payload exceeds the configured size limit.");
  }
  return response;
}
