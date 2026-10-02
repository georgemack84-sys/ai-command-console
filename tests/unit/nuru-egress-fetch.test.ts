import { describe, expect, it, vi } from "vitest";

const checks = vi.hoisted(() => ({ resolve: vi.fn(async () => new URL("https://example.com")) }));
const configuration = vi.hoisted(() => ({ required: false, proxyUrl: undefined as string | undefined }));
vi.mock("@/src/server/security/server-url-policy", () => ({ assertResolvedPublicSourceUrl: checks.resolve }));
vi.mock("@/src/config/env", () => ({
  env: { get NURU_EGRESS_PROXY_URL() { return configuration.proxyUrl; } },
  nuruEgressProxyRequired: () => configuration.required,
}));
import { fetchFromNuruEgress } from "@/src/server/security/nuru-egress-fetch";

describe("Nuru egress fetch", () => {
  it("checks DNS before making an outbound request", async () => {
    const fetchMock = vi.fn(async () => new Response("ok", { headers: { "content-length": "2" } }));
    vi.stubGlobal("fetch", fetchMock);
    await fetchFromNuruEgress("https://example.com", { maxBytes: 10, redirect: "manual" });
    expect(checks.resolve).toHaveBeenCalledWith("https://example.com");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("fails closed when required proxy enforcement is absent", async () => {
    configuration.required = true;
    configuration.proxyUrl = undefined;
    await expect(fetchFromNuruEgress("https://example.com", { maxBytes: 10 })).rejects.toMatchObject({
      status: 503,
      code: "egress_proxy_unavailable",
    });
    configuration.required = false;
  });

  it("accepts a configured proxy only when Node proxy support is enabled", async () => {
    configuration.required = true;
    configuration.proxyUrl = "http://nuru-egress-proxy:3128";
    const original = {
      nodeUseEnvProxy: process.env.NODE_USE_ENV_PROXY,
      httpProxy: process.env.HTTP_PROXY,
      httpsProxy: process.env.HTTPS_PROXY,
    };
    process.env.NODE_USE_ENV_PROXY = "1";
    process.env.HTTP_PROXY = configuration.proxyUrl;
    process.env.HTTPS_PROXY = configuration.proxyUrl;
    const fetchMock = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    await fetchFromNuruEgress("https://example.com", { maxBytes: 10 });
    expect(fetchMock).toHaveBeenCalledOnce();
    process.env.NODE_USE_ENV_PROXY = original.nodeUseEnvProxy;
    process.env.HTTP_PROXY = original.httpProxy;
    process.env.HTTPS_PROXY = original.httpsProxy;
    configuration.required = false;
    configuration.proxyUrl = undefined;
  });
});
