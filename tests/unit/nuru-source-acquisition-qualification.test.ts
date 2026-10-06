import { describe, expect, it } from "vitest";
import { NuruSourceAcquisitionService, type SourceAcquisitionDiagnostic } from "@/src/server/services/nuru-source-acquisition-service";

const source = { id: "registry-official", workspaceId: "workspace-1", name: "Example Department", domain: "official.example", baseUrl: "https://official.example/", category: "GOVERNMENT" as const, topics: [], authorityClass: "PRIMARY" as const, ingestionMethods: ["WEB"] as const, refreshPolicy: "ON_DEMAND" as const, admissionState: "APPROVED" as const, operationalState: "HEALTHY" as const, enabled: true, requiresReview: false };
const request = { sourceRegistryId: source.id, acquisitionMethod: "WEB" as const, identity: { organization: "Example Government", publicationOrSystem: "Official Gazette", document: "Guidance 2026-01", version: "2026-01-02" }, url: "https://official.example/guidance" };

function fixture() {
  const diagnostics: SourceAcquisitionDiagnostic[] = [];
  return { diagnostics, registry: { get: async () => source }, store: { append: async (diagnostic: SourceAcquisitionDiagnostic) => { diagnostics.push(diagnostic); } } };
}

function response(body: string, status = 200, contentType = "text/html") {
  return new Response(body, { status, headers: { "content-type": contentType } });
}

describe("NRQ-10 source intelligence qualification", () => {
  it("keeps organization, publication, document, and version identity distinct from the URL", async () => {
    const one = fixture();
    const two = fixture();
    await NuruSourceAcquisitionService.acquire(request, { workspaceId: "workspace-1" }, one.registry, one.store, async () => response("official guidance"));
    await NuruSourceAcquisitionService.acquire({ ...request, url: "https://mirror.example/guidance" }, { workspaceId: "workspace-1" }, two.registry, two.store, async () => response("official guidance"));
    expect(one.diagnostics[0].identity).toEqual(two.diagnostics[0].identity);
    expect(one.diagnostics[0].requestedUrl).not.toBe(two.diagnostics[0].requestedUrl);
    expect(one.diagnostics[0].state).toBe("CAPTURED");
  });

  it("preserves controlled failure and change diagnostics without admitting a claim", async () => {
    const cases: Array<[string, () => Promise<Response>, string, Partial<typeof request>]> = [
      ["not found", async () => response("missing", 404), "NOT_FOUND", {}],
      ["forbidden", async () => response("denied", 403), "FORBIDDEN", {}],
      ["rate limited", async () => response("slow down", 429), "RATE_LIMITED", {}],
      ["redirect", async () => new Response(null, { status: 302, headers: { location: "https://official.example/new" } }), "REDIRECTED", {}],
      ["malformed", async () => response("binary", 200, "application/octet-stream"), "MALFORMED", {}],
      ["empty", async () => response("   "), "EMPTY", {}],
      ["changed", async () => response("new official guidance"), "CHANGED", { previousContentHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }],
      ["duplicate", async () => response("official guidance"), "DUPLICATE", { knownContentHashes: ["sha256:fd7447f82214c47e3daf1fc27c67cf5597f565eecef9e443d640786680ce9001"] }],
    ];
    for (const [, fetchImpl, expected, patch] of cases) {
      const current = fixture();
      await NuruSourceAcquisitionService.acquire({ ...request, ...patch }, { workspaceId: "workspace-1" }, current.registry, current.store, fetchImpl);
      expect(current.diagnostics).toHaveLength(1);
      expect(current.diagnostics[0].state).toBe(expected);
      expect(current.diagnostics[0].identity).toEqual(request.identity);
    }
  });

  it("records timeouts and keeps high authority separate from truth or canonical admission", async () => {
    const current = fixture();
    const result = await NuruSourceAcquisitionService.acquire(request, { workspaceId: "workspace-1" }, current.registry, current.store, async () => { throw new DOMException("Timed out", "TimeoutError"); });
    expect(result.state).toBe("TIMEOUT");
    expect(current.diagnostics[0]).toMatchObject({ sourceRegistryId: source.id, state: "TIMEOUT" });
    expect(Object.keys(result)).not.toContain("canonicalRecord");
  });
});
