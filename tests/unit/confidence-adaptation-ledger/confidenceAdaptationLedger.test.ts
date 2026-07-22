import { describe, expect, it } from "vitest";
import {
  getConfidenceAdaptationLedgerFoundation,
  recordConfidenceAdaptationLedger,
  replayConfidenceAdaptationLedger,
} from "@/services/confidence-adaptation-ledger";
import type {
  ConfidenceAdaptationLedgerFailure,
  ConfidenceAdaptationLedgerScenario,
} from "@/types/confidence-adaptation-ledger";

describe("Mission Control Phase 10.6.6 Confidence Adaptation Ledger", () => {
  it("publishes the confidence adaptation ledger foundation", () => {
    const foundation = getConfidenceAdaptationLedgerFoundation();

    expect(foundation.confidence_adaptation_ledger_version).toBe("confidence-adaptation-ledger/v1");
    expect(foundation.api_surface.record_ledger).toBe("POST /confidence-adaptation-ledger/analyze");
    expect(foundation.result.validation.state).toBe("VERIFIED");
  });

  it("records ledger history deterministically", () => {
    const first = recordConfidenceAdaptationLedger({ scenario: "HIGH_RISK" });
    const second = recordConfidenceAdaptationLedger({ scenario: "HIGH_RISK" });

    expect(first.ledger_records[0].ledger_record_id).toBe(second.ledger_records[0].ledger_record_id);
    expect(first.registry.registry_id).toBe(second.registry.registry_id);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("preserves proposal, governance, simulation, replay, operator, rollback, and certification history", () => {
    const result = recordConfidenceAdaptationLedger({ scenario: "CERTIFIED" });
    const events = result.ledger_records.map((record) => record.ledger_event_type);

    expect(events).toContain("PROPOSAL_CREATED");
    expect(events).toContain("GOVERNANCE_REVIEW_RECORDED");
    expect(events).toContain("SIMULATION_RECORDED");
    expect(events).toContain("REPLAY_VALIDATED");
    expect(events).toContain("OPERATOR_DECISION_RECORDED");
    expect(events).toContain("CERTIFICATION_DECISION_RECORDED");
    expect(result.certification_record.certification_status).toBe("CERTIFIED");
  });

  it("records calibration lineage, replay lineage, certification history, and rollback history", () => {
    const result = recordConfidenceAdaptationLedger({ scenario: "ROLLBACK" });

    expect(result.calibration_lineage.parent_proposal_id).toBeTruthy();
    expect(result.calibration_lineage.child_proposal_ids.length).toBeGreaterThan(0);
    expect(result.replay_record.replay_verification_status).toBe("VERIFIED");
    expect(result.certification_record.reviewer_refs.length).toBeGreaterThan(0);
    expect(result.rollback_record.rollback_status).toBe("APPROVED");
    expect(result.rollback_record.rollback_approvals.length).toBeGreaterThan(0);
  });

  it("preserves all confidence pattern categories when requested", () => {
    const result = recordConfidenceAdaptationLedger({ scenario: "ALL_PATTERNS" });

    expect(result.registry.preserved_patterns).toContain("OVERCONFIDENCE");
    expect(result.registry.preserved_patterns).toContain("UNDERCONFIDENCE");
    expect(result.registry.preserved_patterns).toContain("FALSE_CERTAINTY");
    expect(result.registry.preserved_patterns).toContain("FALSE_CAUTION");
    expect(result.registry.preserved_patterns).toContain("EVIDENCE_INFLATION");
    expect(result.registry.preserved_patterns).toContain("EVIDENCE_INSUFFICIENCY");
    expect(result.registry.preserved_patterns).toContain("UNKNOWN_UNCERTAINTY");
    expect(result.registry.preserved_patterns).toContain("PREDICTION_INSTABILITY");
    expect(result.registry.preserved_patterns).toContain("MISSION_SPECIFIC_BIAS");
    expect(result.registry.preserved_patterns).toContain("OPERATOR_SPECIFIC_CONFIDENCE_BEHAVIOR");
    expect(result.registry.preserved_patterns).toContain("DOMAIN_SPECIFIC_CALIBRATION_DRIFT");
    expect(result.registry.preserved_patterns).toContain("CONFIDENCE_SATURATION");
    expect(result.registry.preserved_patterns).toContain("CONFIDENCE_COLLAPSE");
  });

  it("builds an immutable append-only registry with event indexes", () => {
    const result = recordConfidenceAdaptationLedger();
    const record = result.ledger_records[0];

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.ledger_record_refs).toContain(record.ledger_record_id);
    expect(result.registry.event_index.PROPOSAL_CREATED).toContain(record.ledger_record_id);
  });

  it("keeps the ledger advisory-only without production or history mutation", () => {
    const result = recordConfidenceAdaptationLedger({ scenario: "HIGH_RISK" });
    const record = result.ledger_records[0];

    expect(result.advisory_only).toBe(true);
    expect(result.append_only).toBe(true);
    expect(result.immutable).toBe(true);
    expect(result.modifies_production_confidence).toBe(false);
    expect(result.updates_confidence_model).toBe(false);
    expect(result.mutates_historical_records).toBe(false);
    expect(record.advisory_only).toBe(true);
    expect(record.modifies_production_confidence).toBe(false);
  });

  it("replays confidence adaptation ledger records", () => {
    const result = recordConfidenceAdaptationLedger();

    expect(replayConfidenceAdaptationLedger(result)).toBe(true);
  });

  it.each([
    ["MISSING_PROPOSAL", "PROPOSAL_REFERENCE_MISSING"],
    ["MISSING_EVIDENCE", "SUPPORTING_EVIDENCE_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCE_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_INTEGRITY", "INTEGRITY_HASH_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_CHAIN_INCOMPLETE"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_HISTORY_MISSING"],
    ["MISSING_ROLLBACK", "ROLLBACK_HISTORY_MISSING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["LEDGER_UPDATE", "LEDGER_UPDATE_DETECTED"],
    ["LEDGER_DELETE", "LEDGER_DELETE_DETECTED"],
    ["PRODUCTION_MUTATION", "PRODUCTION_CONFIDENCE_MUTATION_DETECTED"],
    ["MODEL_UPDATE", "CONFIDENCE_MODEL_UPDATE_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["REPLAY_BYPASS", "REPLAY_BYPASS_DETECTED"],
    ["OPERATOR_APPROVAL_BYPASS", "OPERATOR_APPROVAL_BYPASS_DETECTED"],
    ["AUDIT_DISABLED", "AUDIT_LOGGING_DISABLED"],
    ["HISTORICAL_RECORD_MUTATION", "HISTORICAL_RECORD_MUTATION_DETECTED"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_LEDGER_RECORDING"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [ConfidenceAdaptationLedgerScenario, ConfidenceAdaptationLedgerFailure][])("fails closed for %s", (scenario, failure) => {
    const result = recordConfidenceAdaptationLedger({ scenario });

    expect(result.validation.verified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.updates_confidence_model).toBe(false);
  });

  it("marks missing replay as pending replay", () => {
    const result = recordConfidenceAdaptationLedger({ scenario: "MISSING_REPLAY" });

    expect(result.validation.state).toBe("PENDING_REPLAY");
    expect(result.validation.replay_complete).toBe(false);
  });

  it("detects ledger tampering during replay", () => {
    const result = recordConfidenceAdaptationLedger();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayConfidenceAdaptationLedger(tampered)).toBe(false);
  });
});
