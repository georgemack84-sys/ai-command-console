import { describe, expect, it } from "vitest";

import { buildOrchestrationAuditRecord } from "@/services/orchestration/orchestrationAudit";

describe("buildOrchestrationAuditRecord", () => {
  it("builds append-only deterministic audit records", () => {
    const result = buildOrchestrationAuditRecord({
      eventType: "orchestration.denied",
      requestType: "recovery.review",
      constitutionalState: "DENIED",
      reasoning: ["disputed_truth_detected"],
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.eventType).toBe("orchestration.denied");
    expect(result.reasoning).toEqual(["disputed_truth_detected"]);
  });
});
