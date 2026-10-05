import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findArtifacts: vi.fn(), findAuditEvents: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruRawArtifact: { findMany: mocks.findArtifacts }, nuruAuditEvent: { findMany: mocks.findAuditEvents } } }));

import { NuruArtifactIntegrityService } from "@/src/server/services/nuru-artifact-integrity-service";

describe("Nuru raw artifact integrity", () => {
  it("emits a deterministic manifest for verified raw bytes", async () => {
    const body = Buffer.from("evidence");
    mocks.findArtifacts.mockResolvedValue([{ id: "RAW-1", body, byteLength: body.byteLength, contentHash: "sha256:ee8250fb76e094b34b471f13a73dbbe51d1ae142e9df59d7c0d31ec20f0a0a8e" }]);
    mocks.findAuditEvents.mockResolvedValue([{ id: "audit-1" }]);
    await expect(NuruArtifactIntegrityService.verifyWorkspace("workspace-1")).resolves.toMatchObject({ workspaceId: "workspace-1", artifactCount: 1, auditEventCount: 1, manifestHash: expect.stringMatching(/^sha256:/) });
  });

  it("fails closed if retained bytes no longer match their recorded hash", async () => {
    mocks.findArtifacts.mockResolvedValue([{ id: "RAW-2", body: Buffer.from("tampered"), byteLength: 8, contentHash: "sha256:invalid" }]);
    mocks.findAuditEvents.mockResolvedValue([]);
    await expect(NuruArtifactIntegrityService.verifyWorkspace("workspace-1")).rejects.toMatchObject({ status: 409, code: "raw_artifact_integrity_failed" });
  });
});
