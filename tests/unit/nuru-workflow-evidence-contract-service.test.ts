import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ search: vi.fn() }));
vi.mock("@/src/server/services/nuru-search-service", () => ({ NuruSearchService: { search: mocks.search } }));

import { AppError } from "@/src/server/api/errors";
import { assertNuruWorkflowEvidenceCorrelation, getNuruWorkflowHealth, retrieveNuruWorkflowEvidence, validateNuruWorkflowEvidenceHeaders } from "@/src/server/services/nuru-workflow-evidence-contract-service";

const input = { correlationId: "correlation-123", idempotencyKey: "idempotency-123", query: "ocean exploration", resource: "reference-workflow" };
const identity = { workspaceId: "workspace-1", principalId: "principal-1" };

describe("Nuru workflow evidence contract", () => {
  beforeEach(() => { mocks.search.mockReset(); });

  it("requires a Bearer credential, correlation ID, and idempotency key", () => {
    expect(() => validateNuruWorkflowEvidenceHeaders({ authorization: null, correlationId: input.correlationId, idempotencyKey: input.idempotencyKey })).toThrow(AppError);
    expect(validateNuruWorkflowEvidenceHeaders({ authorization: "Bearer credential-value", correlationId: input.correlationId, idempotencyKey: input.idempotencyKey })).toMatchObject({ credential: "credential-value" });
  });

  it("rejects correlation and idempotency mismatches", () => {
    expect(() => assertNuruWorkflowEvidenceCorrelation(input, { correlationId: "correlation-other", idempotencyKey: input.idempotencyKey })).toThrow(/correlation/i);
    expect(() => assertNuruWorkflowEvidenceCorrelation(input, { correlationId: input.correlationId, idempotencyKey: "idempotency-other" })).toThrow(/idempotency/i);
  });

  it("retrieves typed evidence through the read-only search service and replays safely", async () => {
    mocks.search.mockResolvedValue([{ id: "knowledge-1", title: "Ocean record", contentType: "research", project: "Nuru", confidence: 0.9, createdAt: new Date("2026-10-14T00:00:00Z") }]);
    const first = await retrieveNuruWorkflowEvidence(input, identity);
    const replay = await retrieveNuruWorkflowEvidence(input, identity);
    expect(first).toMatchObject({ replayed: false, evidence: [{ id: "knowledge-1", title: "Ocean record" }], audit: { operation: "evidence.retrieve" } });
    expect(replay.replayed).toBe(true);
    expect(mocks.search).toHaveBeenCalledOnce();
  });

  it("rejects a reused key with different input and classifies transient failures as retryable", async () => {
    mocks.search.mockResolvedValue([]);
    await retrieveNuruWorkflowEvidence(input, identity);
    await expect(retrieveNuruWorkflowEvidence({ ...input, query: "climate policy" }, identity)).rejects.toMatchObject({ status: 409, code: "idempotency_conflict" });
    mocks.search.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(retrieveNuruWorkflowEvidence({ ...input, idempotencyKey: "idempotency-456" }, identity)).rejects.toMatchObject({ status: 503, code: "evidence_retrieval_unavailable" });
  });

  it("publishes only non-sensitive health metadata", () => {
    expect(getNuruWorkflowHealth()).toEqual({ service: "nuru", contract: "nuru.workflow.evidence", version: "1", status: "ready", mode: "read_only", operations: ["evidence.retrieve"] });
  });
});
