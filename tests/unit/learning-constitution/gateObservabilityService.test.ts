import { describe, expect, it } from "vitest";

import { GateObservabilityService, InMemoryGateAuditLedger } from "@/services/learning-constitution";
import type { GateAuditEvent, GateOutcome } from "@/types/learning-constitution";

const event = (id: string, candidateId: string, outcome: GateOutcome, reasons: GateAuditEvent["decision"]["reasonCodes"], occurredAt: string): GateAuditEvent => ({
  eventId: id,
  eventType: "DURABLE_LEARNING_GATE_EVALUATED",
  occurredAt,
  decision: {
    evaluationId: id.replace("audit:", "evaluation:"), candidateId, outcome, reasonCodes: reasons, checks: [], inputFingerprint: id,
    context: { gateVersion: "9.0.0", constitutionVersion: "1", taxonomyVersion: "1", authorityPolicyVersion: "1", validationPolicyVersion: "1", conflictEngineVersion: "8", registryVersion: "381", learningIntent: "EXPLICIT", decisionActorId: "user:owner" },
    authorityEffect: "UNCHANGED", executionPermissionGranted: false,
  },
});

describe("GateObservabilityService", () => {
  it("derives read-only outcomes, vetoes, failures, and re-evaluation counts from audit history", async () => {
    const audit = new InMemoryGateAuditLedger();
    await audit.append(event("audit:1", "candidate:1", "ACCEPT", [], "2026-08-31T00:01:00.000Z"));
    await audit.append(event("audit:2", "candidate:1", "DEFER", ["CONFLICT_UNRESOLVED"], "2026-08-31T00:02:00.000Z"));
    await audit.append(event("audit:3", "candidate:2", "REJECT", ["CONSTITUTIONAL_VETO", "VALIDATION_FAILED"], "2026-08-31T00:03:00.000Z"));

    await expect(new GateObservabilityService(audit).summarize()).resolves.toEqual(expect.objectContaining({
      totalEvaluations: 3,
      outcomes: { ACCEPT: 1, DEFER: 1, REJECT: 1 },
      constitutionalVetoCount: 1,
      validationFailureCount: 1,
      conflictDeferralCount: 1,
      reEvaluationCount: 1,
      auditIntegrity: "VERIFIED",
      currentGateVersion: "9.0.0",
      latestEvaluationAt: "2026-08-31T00:03:00.000Z",
    }));
  });
});
