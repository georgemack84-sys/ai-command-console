import { describe, expect, it } from "vitest";
import { NuruPermissionsService } from "@/src/server/services/nuru-permissions-service";

const context = { correlationId: "run-1", purpose: "Curate an architectural candidate" };

describe("Nuru Permissions Service", () => {
  it("grants Discovery only its minimum necessary capabilities", () => {
    expect(NuruPermissionsService.authorize({ subject: "nuru.discovery.v1", resource: "knowledge", action: "SEARCH", context }).allowed).toBe(true);
    expect(NuruPermissionsService.authorize({ subject: "nuru.discovery.v1", resource: "archive", action: "ARCHIVE", context })).toMatchObject({ allowed: false, reason: expect.stringMatching(/cannot/i) });
  });

  it("fails closed for unknown subjects and prevents self-administration", () => {
    expect(NuruPermissionsService.authorize({ subject: "unknown-agent", resource: "knowledge", action: "READ", context }).allowed).toBe(false);
    expect(NuruPermissionsService.authorize({ subject: "nuru.curator.v1", resource: "permissions", action: "ADMINISTER", context }).allowed).toBe(false);
  });

  it("reserves approved durable mutations for governance", () => {
    expect(NuruPermissionsService.authorize({ subject: "nuru.governance.v1", resource: "archive", action: "ARCHIVE", context }).allowed).toBe(true);
  });
});
