import { describe, expect, it } from "vitest";
import {
  FailClosedUncertaintyEngine,
  UncertaintyClassifier,
  UncertaintyPolicyValidator,
  UncertaintyReasonGenerator,
  UncertaintyReplayService,
  UncertaintySeverityCalculator,
  buildFailClosedDecision,
  buildFailClosedUncertaintyRecord,
  calculateUncertaintySeverity,
  classifyUncertainty,
  recordUncertaintyLineage,
  resolveFailClosedOutcome,
  type FailClosedUncertaintyRequest,
  type UncertaintySignal,
} from "@/services/confidence-engine/failClosedUncertaintyFramework";

function buildSignal(overrides: Partial<UncertaintySignal> = {}): UncertaintySignal {
  return Object.freeze({
    signal_id: "signal-001",
    tenant_id: "tenant-alpha",
    recommendation_id: "recommendation-53i",
    source_phase: "RISK_ESCALATION",
    uncertainty_type: "CONFIDENCE_COLLAPSE",
    trigger_source: "risk-escalation/v1",
    source_hash: "hash-risk-escalation",
    policy_references: ["risk-escalation-policy/v1"],
    lineage_references: ["lineage-risk-escalation"],
    replay_references: ["replay-risk-escalation"],
    reason_codes: ["CONFIDENCE_COLLAPSE"],
    timestamp: "2026-06-02T12:00:00.000Z",
    version: "uncertainty-signal/v1",
    ...overrides,
  } satisfies UncertaintySignal);
}

function buildRequest(overrides: Partial<FailClosedUncertaintyRequest> = {}): FailClosedUncertaintyRequest {
  return Object.freeze({
    tenant_id: "tenant-alpha",
    recommendation_id: "recommendation-53i",
    signals: [buildSignal()],
    timestamp: "2026-06-02T12:05:00.000Z",
    version: "fail-closed-uncertainty/v1",
    policy_version: "fail-closed-uncertainty-policy/v1",
    ...overrides,
  } satisfies FailClosedUncertaintyRequest);
}

describe("failClosedUncertaintyFramework", () => {
  it("produces deterministic records for identical uncertainty", () => {
    const request = buildRequest();
    const first = buildFailClosedUncertaintyRecord(request);
    const second = FailClosedUncertaintyEngine.build(request);

    expect(first).toEqual(second);
    expect(first.decision.recommended_outcome).toBe("LIMIT_SCOPE");
    expect(first.decision.severity).toBe("MODERATE");
    expect(first.certification.deterministic).toBe(true);
    expect(first.certification.fail_closed).toBe(true);
  });

  it("classifies uncertainty and calculates severity deterministically", () => {
    const signals = [
      buildSignal({ uncertainty_type: "CONFIDENCE_COLLAPSE" }),
      buildSignal({
        signal_id: "signal-002",
        source_phase: "CONFIDENCE_LINEAGE_REPLAY",
        uncertainty_type: "REPLAY_MISMATCH",
      }),
    ];

    expect(classifyUncertainty(signals)).toEqual(UncertaintyClassifier.classify(signals));
    expect(calculateUncertaintySeverity(signals)).toBe("CRITICAL");
    expect(UncertaintySeverityCalculator.calculate(signals)).toBe("CRITICAL");
    expect(resolveFailClosedOutcome(signals)).toBe("FREEZE_REPLAY_RESULT");
  });

  it("preserves tenant isolation and blocks cross-tenant uncertainty", () => {
    const record = buildFailClosedUncertaintyRecord(buildRequest({
      signals: [
        buildSignal({
          tenant_id: "tenant-beta",
          uncertainty_type: "TENANT_MISMATCH",
        }),
      ],
    }));

    expect(record.decision.severity).toBe("CRITICAL");
    expect(record.decision.recommended_outcome).toBe("BLOCK_RESULT");
    expect(record.decision.reason_codes).toContain("CROSS_TENANT_UNCERTAINTY_BLOCKED");
    expect(record.certification.tenant_isolated).toBe(false);
    expect(record.certification.certified).toBe(false);
  });

  it("freezes replay outputs for lineage corruption", () => {
    const record = buildFailClosedUncertaintyRecord(buildRequest({
      signals: [
        buildSignal({
          source_phase: "CONFIDENCE_LINEAGE_REPLAY",
          uncertainty_type: "LINEAGE_CORRUPTION",
        }),
      ],
    }));

    expect(record.decision.recommended_outcome).toBe("FREEZE_REPLAY_RESULT");
    expect(record.decision.reason_codes).toContain("LINEAGE_CORRUPTION_DETECTED");
    expect(record.replay.replay_status).toBe("REPLAY_VERIFIED");
  });

  it("fails closed when policy references are unavailable", () => {
    const request = buildRequest({
      signals: [
        buildSignal({
          uncertainty_type: "POLICY_GAP",
          policy_references: [],
        }),
      ],
    });
    const record = buildFailClosedUncertaintyRecord(request);

    expect(UncertaintyPolicyValidator.validate(request).policy_available).toBe(false);
    expect(record.decision.recommended_outcome).toBe("BLOCK_RESULT");
    expect(record.decision.reason_codes).toContain("POLICY_REFERENCE_MISSING");
    expect(record.decision.reason_codes).toContain("POLICY_GAP_DETECTED");
  });

  it("fails closed on hash mismatches", () => {
    const record = buildFailClosedUncertaintyRecord(buildRequest({
      signals: [
        buildSignal({
          uncertainty_type: "HASH_MISMATCH",
          source_hash: "",
        }),
      ],
    }));

    expect(record.decision.severity).toBe("CRITICAL");
    expect(record.decision.recommended_outcome).toBe("BLOCK_RESULT");
    expect(record.decision.reason_codes).toContain("HASH_REFERENCE_MISSING");
    expect(record.decision.reason_codes).toContain("HASH_MISMATCH_DETECTED");
  });

  it("increases restriction for authority ambiguity", () => {
    const record = buildFailClosedUncertaintyRecord(buildRequest({
      signals: [
        buildSignal({
          source_phase: "RISK_ESCALATION",
          uncertainty_type: "AUTHORITY_AMBIGUITY",
        }),
      ],
    }));

    expect(record.decision.severity).toBe("CRITICAL");
    expect(record.decision.recommended_outcome).toBe("BLOCK_RESULT");
    expect(record.decision.reason_codes).toContain("AUTHORITY_AMBIGUITY_DETECTED");
  });

  it("freezes replay for replay mismatch and partial replay", () => {
    const replayMismatch = buildFailClosedUncertaintyRecord(buildRequest({
      signals: [
        buildSignal({
          source_phase: "CONFIDENCE_LINEAGE_REPLAY",
          uncertainty_type: "REPLAY_MISMATCH",
        }),
      ],
    }));
    const partialReplay = buildFailClosedUncertaintyRecord(buildRequest({
      signals: [
        buildSignal({
          source_phase: "CONFIDENCE_LINEAGE_REPLAY",
          uncertainty_type: "PARTIAL_REPLAY",
        }),
      ],
    }));

    expect(replayMismatch.decision.recommended_outcome).toBe("FREEZE_REPLAY_RESULT");
    expect(partialReplay.decision.recommended_outcome).toBe("FAIL_REPLAY");
  });

  it("freezes observability and operator views for visibility corruption", () => {
    const observability = buildFailClosedUncertaintyRecord(buildRequest({
      signals: [
        buildSignal({
          source_phase: "RISK_OBSERVABILITY",
          uncertainty_type: "OBSERVABILITY_CORRUPTION",
        }),
      ],
    }));
    const operator = buildFailClosedUncertaintyRecord(buildRequest({
      signals: [
        buildSignal({
          source_phase: "OPERATOR_RISK_VISIBILITY",
          uncertainty_type: "OPERATOR_VISIBILITY_CORRUPTION",
        }),
      ],
    }));

    expect(observability.decision.recommended_outcome).toBe("FREEZE_OBSERVABILITY_RESULT");
    expect(operator.decision.recommended_outcome).toBe("FREEZE_OPERATOR_VIEW");
  });

  it("records lineage and replay reproducibly", () => {
    const request = buildRequest();
    const decision = buildFailClosedDecision(request);
    const lineage = recordUncertaintyLineage({ request, decision });
    const replay = UncertaintyReplayService.replay({ decision, lineage });

    expect(lineage).toEqual(recordUncertaintyLineage({ request, decision }));
    expect(replay).toEqual(UncertaintyReplayService.replay({ decision, lineage }));
    expect(replay.replayed_severity).toBe(decision.severity);
    expect(replay.replayed_outcome).toBe(decision.recommended_outcome);
    expect(replay.replayed_reason_codes).toEqual(decision.reason_codes);
  });

  it("freezes replay when lineage chronology no longer matches the decision", () => {
    const request = buildRequest();
    const decision = buildFailClosedDecision(request);
    const lineage = recordUncertaintyLineage({ request, decision });
    const tamperedLineage = Object.freeze({
      ...lineage,
      recommended_restriction: "BLOCK_RESULT" as const,
    });
    const replay = UncertaintyReplayService.replay({ decision, lineage: tamperedLineage });

    expect(replay.replay_status).toBe("FREEZE_REPLAY_RESULT");
    expect(replay.chronology_valid).toBe(false);
  });

  it("keeps the framework advisory-only with no execution paths", () => {
    const record = buildFailClosedUncertaintyRecord(buildRequest());

    expect(record.read_only).toBe(true);
    expect(record.advisory_only).toBe(true);
    expect(record.execution_permitted).toBe(false);
    expect(record.mutation_performed).toBe(false);
    expect(record.authority_changed).toBe(false);
    expect(record.may_execute).toBe(false);
    expect(record.may_schedule).toBe(false);
    expect(record.may_mutate_state).toBe(false);
    expect(record.may_change_approval).toBe(false);
    expect(record.may_change_authority).toBe(false);
    expect(record.may_route_workflow).toBe(false);
    expect(record.may_remediate).toBe(false);
  });

  it("does not mutate source uncertainty inputs", () => {
    const request = buildRequest();
    const before = JSON.stringify(request);

    buildFailClosedUncertaintyRecord(request);
    UncertaintyReasonGenerator.generate(request);

    expect(JSON.stringify(request)).toBe(before);
  });
});
