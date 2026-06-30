import { describe, expect, it } from "vitest";
import {
  buildTruthPolicyLedgerRequest,
  sealTruthPolicyLedger,
} from "@/services/mission-control";
import type { TruthPolicyLedgerInput, TruthPolicyLedgerEventType } from "@/services/mission-control";

function baseLedgerInput(overrides: Partial<TruthPolicyLedgerInput> = {}): TruthPolicyLedgerInput {
  return {
    request: buildTruthPolicyLedgerRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T20:00:00.000Z",
    }),
    policyId: "policy-alpha",
    missionId: "mission-alpha",
    eventType: "POLICY_CREATED",
    actorId: "operator-alpha",
    actorType: "OPERATOR",
    rationale: "Policy event is recorded for governance audit.",
    evidenceReferences: [{
      evidence_id: "evidence-alpha",
      evidence_type: "POLICY_ARTIFACT",
      evidence_hash: "hash-alpha",
      evidence_scope: "tenant-alpha",
    }],
    replayReferences: [{
      replay_id: "replay-alpha",
      replay_bundle_id: "bundle-alpha",
      replay_hash: "replay-hash-alpha",
    }],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

function expectEventPass(eventType: TruthPolicyLedgerEventType) {
  const result = sealTruthPolicyLedger(baseLedgerInput({
    eventType,
    evaluationResult: eventType === "POLICY_EVALUATED" ? "ALLOW" : undefined,
    violationSeverity: eventType === "POLICY_VIOLATION" ? "HIGH" : undefined,
  }));

  expect(result.certification).toBe("PASS");
  expect(result.validation.valid).toBe(true);
  expect(result.replay.replayResult).toBe("REPRODUCED");
}

describe("policyLedger", () => {
  it("records policy creation deterministically", () => {
    const first = sealTruthPolicyLedger(baseLedgerInput());
    const second = sealTruthPolicyLedger(baseLedgerInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.validation.reasonCodes).toContain("CREATION_RECORDED");
  });

  it("records all policy ledger event classes", () => {
    expectEventPass("POLICY_CREATED");
    expectEventPass("POLICY_UPDATED");
    expectEventPass("POLICY_EVALUATED");
    expectEventPass("POLICY_VIOLATION");
    expectEventPass("POLICY_ESCALATION");
    expectEventPass("CONTAINMENT_ACTION");
  });

  it("fails missing creation and update entries", () => {
    const creation = sealTruthPolicyLedger(baseLedgerInput({ missingEventRecordDetected: true }));
    const update = sealTruthPolicyLedger(baseLedgerInput({
      eventType: "POLICY_UPDATED",
      missingEventRecordDetected: true,
    }));

    expect(creation.certification).toBe("FAIL");
    expect(creation.validation.reasonCodes).toContain("CREATION_MISSING");
    expect(update.certification).toBe("FAIL");
    expect(update.validation.reasonCodes).toContain("UPDATE_MISSING");
  });

  it("fails missing evaluation and violation records", () => {
    const evaluation = sealTruthPolicyLedger(baseLedgerInput({
      eventType: "POLICY_EVALUATED",
      missingEventRecordDetected: true,
    }));
    const violation = sealTruthPolicyLedger(baseLedgerInput({
      eventType: "POLICY_VIOLATION",
      missingEventRecordDetected: true,
    }));

    expect(evaluation.certification).toBe("FAIL");
    expect(evaluation.validation.reasonCodes).toContain("EVALUATION_MISSING");
    expect(violation.certification).toBe("FAIL");
    expect(violation.validation.reasonCodes).toContain("VIOLATION_MISSING");
  });

  it("fails missing escalation and containment records", () => {
    const escalation = sealTruthPolicyLedger(baseLedgerInput({
      eventType: "POLICY_ESCALATION",
      missingEventRecordDetected: true,
    }));
    const containment = sealTruthPolicyLedger(baseLedgerInput({
      eventType: "CONTAINMENT_ACTION",
      missingEventRecordDetected: true,
    }));

    expect(escalation.certification).toBe("FAIL");
    expect(escalation.validation.reasonCodes).toContain("ESCALATION_MISSING");
    expect(containment.certification).toBe("FAIL");
    expect(containment.validation.reasonCodes).toContain("CONTAINMENT_MISSING");
  });

  it("fails missing evidence and replay bindings", () => {
    const missingEvidence = sealTruthPolicyLedger(baseLedgerInput({ evidenceMissingDetected: true }));
    const missingReplay = sealTruthPolicyLedger(baseLedgerInput({ replayReferenceMissingDetected: true }));

    expect(missingEvidence.certification).toBe("FAIL");
    expect(missingEvidence.validation.evidenceBindingValid).toBe(false);
    expect(missingReplay.certification).toBe("FAIL");
    expect(missingReplay.validation.replayBindingValid).toBe(false);
  });

  it("detects tampering and entry modification", () => {
    const tampered = sealTruthPolicyLedger(baseLedgerInput({ tamperedEntryDetected: true }));
    const modified = sealTruthPolicyLedger(baseLedgerInput({ entryModificationDetected: true }));

    expect(tampered.certification).toBe("FAIL");
    expect(tampered.validation.reasonCodes).toContain("LEDGER_INTEGRITY_INVALID");
    expect(modified.certification).toBe("FAIL");
    expect(modified.validation.reasonCodes).toContain("ENTRY_MODIFICATION_DETECTED");
  });

  it("fails ledger replay mismatch", () => {
    const result = sealTruthPolicyLedger(baseLedgerInput({ replayMismatchDetected: true }));

    expect(result.certification).toBe("FAIL");
    expect(result.replay.replayResult).toBe("MISMATCH");
    expect(result.validation.reasonCodes).toContain("REPLAY_MISMATCH");
  });

  it("blocks cross-tenant ledger access", () => {
    const result = sealTruthPolicyLedger(baseLedgerInput({
      crossTenantLedgerAccessDetected: true,
      crossTenantReplayAccessDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.tenantIsolationValid).toBe(false);
    expect(result.visibility.tenantScoped).toBe(false);
  });

  it("allows conditional pass for documented observability gaps", () => {
    const result = sealTruthPolicyLedger(baseLedgerInput({
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationDocumented: true,
    }));

    expect(result.certification).toBe("CONDITIONAL_PASS");
    expect(result.validation.valid).toBe(true);
  });

  it("fails closed when control behavior is requested", () => {
    const result = sealTruthPolicyLedger(baseLedgerInput({
      executionRequested: true,
      authorityExpansionDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.executionImpossible).toBe(false);
    expect(result.validation.authorityBounded).toBe(false);
    expect(result.executionAuthorized).toBe(false);
    expect(result.authorityMutationAllowed).toBe(false);
  });
});
