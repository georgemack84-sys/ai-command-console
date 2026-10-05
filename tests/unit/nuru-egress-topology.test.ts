import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import yaml from "js-yaml";

type Compose = { services: Record<string, { networks?: string[]; environment?: Record<string, string> }>; networks: Record<string, { internal?: boolean }> };

describe("Nuru egress topology", () => {
  it("gives external connectivity only to the deny-by-default proxy", () => {
    const compose = yaml.load(readFileSync("docker-compose.staging.yml", "utf8")) as Compose;
    expect(compose.networks["app-internal"]?.internal).toBe(true);
    expect(compose.networks["egress-proxy"]?.internal).toBe(true);
    expect(compose.services.worker?.networks).toEqual(["app-internal", "egress-proxy"]);
    expect(compose.services["egress-proxy"]?.networks).toEqual(["egress-proxy", "egress-external"]);
    expect(compose.services.worker?.environment).toMatchObject({
      NODE_USE_ENV_PROXY: "1",
      HTTP_PROXY: "http://nuru-egress-proxy:3128",
      HTTPS_PROXY: "http://nuru-egress-proxy:3128",
      NURU_EGRESS_PROXY_REQUIRED: "true",
    });
  });

  it("keeps the proxy allowlist empty until deployment review approves domains", () => {
    const allowlist = readFileSync("docker/nuru-egress/allowed-domains.txt", "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"));
    expect(allowlist).toEqual([]);
  });
});
