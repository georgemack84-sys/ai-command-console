import { describe, expect, it } from "vitest";
import { AppError } from "@/src/server/api/errors";
import { createSandboxHeadline, createSyntheticEvidence, parseSandboxRequestHeaders, sandboxEvidenceRequestSchema } from "@/src/server/services/workflow-sandbox-contract-service";

describe("workflow sandbox contract", () => {
  it("requires a bearer credential, correlation id, and idempotency key", () => {
    expect(() => parseSandboxRequestHeaders({ authorization: null, correlationId: "correlation-123", idempotencyKey: "idempotency-123" })).toThrow(AppError);
    expect(parseSandboxRequestHeaders({ authorization: "Bearer credential-value", correlationId: "correlation-123", idempotencyKey: "idempotency-123" })).toMatchObject({ credential: "credential-value" });
  });

  it("returns clearly labeled synthetic evidence and never claims a Nuru retrieval", () => {
    const evidence = createSyntheticEvidence(sandboxEvidenceRequestSchema.parse({ query: "climate policy", resource: "reference-workflow" }));
    expect(evidence.mode).toBe("sandbox_fixture");
    expect(evidence.items[0].summary).toContain("not retrieved from Nuru");
  });

  it("creates a non-publishing sandbox headline", () => {
    const result = createSandboxHeadline({ evidence: { query: "climate policy", resource: "reference-workflow", items: [{ title: "Sandbox evidence for climate policy", summary: "fixture" }] } });
    expect(result.draft).toBe("climate policy");
    expect(result.notice).toContain("No headline was published");
  });
});
