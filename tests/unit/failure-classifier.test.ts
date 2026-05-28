import { describe, expect, it } from "vitest";

import { classifyFailure } from "../../services/failure/failureClassifier";

describe("failure classifier", () => {
  it("classifies crash as a runtime failure", async () => {
    const result = await classifyFailure({
      signal: { type: "crash" },
      sources: { evidence: ["process:crash_dump", "execution:status=failed"] },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          category: "crash",
          severity: expect.any(String),
          recoverable: expect.any(Boolean),
        }),
      }),
    );
  });

  it("classifies timeout as a runtime failure", async () => {
    const result = await classifyFailure({
      signal: { type: "timeout" },
      sources: { evidence: ["timeout:step_duration_exceeded", "execution:status=running"] },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.category).toBe("timeout");
    }
  });

  it("classifies lease expiration distinctly", async () => {
    const result = await classifyFailure({
      signal: { type: "lease expiration" },
      sources: { evidence: ["lock:stale", "lease:expired"] },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.category).toBe("lease expiration");
    }
  });

  it("classifies database unavailable as infrastructure failure", async () => {
    const result = await classifyFailure({
      signal: { type: "database unavailable" },
      sources: { evidence: ["database:unavailable", "dependency:database"] },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.category).toBe("database unavailable");
      expect(result.data.recoverable).toBe(false);
    }
  });

  it("classifies governance denial as an execution failure", async () => {
    const result = await classifyFailure({
      signal: { type: "governance denial" },
      sources: { evidence: ["policy:denied", "governance:decision=deny"] },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.category).toBe("governance denial");
      expect(result.data.recoverable).toBe(false);
    }
  });

  it("classifies verification mismatch as an execution failure", async () => {
    const result = await classifyFailure({
      signal: { type: "verification mismatch" },
      sources: { evidence: ["verification:failed", "evidence:output_hash_mismatch"] },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.category).toBe("verification mismatch");
    }
  });

  it("classifies approval expiration as an operational failure", async () => {
    const result = await classifyFailure({
      signal: { type: "approval expiration" },
      sources: { evidence: ["approval:expired", "recovery_control:approval_required"] },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.category).toBe("approval expiration");
      expect(result.data.requiresApproval).toBe(true);
    }
  });

  it("classifies replay divergence as an operational failure", async () => {
    const result = await classifyFailure({
      signal: { type: "replay divergence" },
      sources: { evidence: ["replay:divergent", "timeline:disputed"] },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.category).toBe("replay divergence");
    }
  });

  it("blocks classification when evidence is missing", async () => {
    const result = await classifyFailure({
      signal: { type: "timeout" },
      sources: { evidence: [] },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: "FAILURE_CLASSIFICATION_EVIDENCE_MISSING",
        }),
      }),
    );
  });

  it("blocks disputed classifications when evidence is contradictory", async () => {
    const result = await classifyFailure({
      signal: { type: "verification mismatch" },
      sources: { evidence: ["verification:passed", "verification:failed"] },
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: "FAILURE_CLASSIFICATION_DISPUTED",
        }),
      }),
    );
  });

  it("produces the same classification for the same evidence", async () => {
    const input = {
      signal: { type: "timeout" as const },
      sources: { evidence: ["timeout:step_duration_exceeded", "execution:status=running"] },
    };

    const left = await classifyFailure(input);
    const right = await classifyFailure(input);

    expect(left).toEqual(right);
  });
});
