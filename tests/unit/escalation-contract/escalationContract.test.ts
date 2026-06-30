import { describe, expect, it } from "vitest";
import {
  buildEscalationContractDoctrine,
  buildEscalationContractRecord,
  buildEscalationObservabilitySurface,
  computeEscalationHash,
  getEscalationContract,
  replayEscalationContract,
  transitionEscalationState,
  validateEscalationContractRecord,
} from "@/services/escalation-contract";

describe("Mission Control Phase 7F.1 Escalation Contract", () => {
  it("defines canonical doctrine, supported types, triggers, severities, routing targets, and lifecycle states", () => {
    const doctrine = buildEscalationContractDoctrine();
    const contract = getEscalationContract();
    expect(doctrine.contract_version).toBe("ESCALATION-CONTRACT-V1");
    expect(doctrine.supported_types).toEqual(["CONSTITUTIONAL", "AUTHORITY", "POLICY", "COMPLIANCE", "GOVERNANCE", "RISK", "RECOMMENDATION", "EVIDENCE", "REPLAY", "OPERATIONAL"]);
    expect(doctrine.supported_triggers).toContain("POLICY_VIOLATION");
    expect(doctrine.supported_severities).toEqual(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);
    expect(doctrine.supported_routing_targets).toContain("EMERGENCY_GOVERNANCE_REVIEW");
    expect(doctrine.lifecycle_states).toContain("CERTIFIED");
    expect(contract.validation.validation_state).toBe("VALID");
  });

  it("builds a valid immutable escalation record with trigger, severity, routing, evidence, replay, ledger, and certification metadata", () => {
    const record = buildEscalationContractRecord();
    const validation = validateEscalationContractRecord(record);
    expect(record.escalation_id).toMatch(/^ESC-7F1-/);
    expect(record.trigger_definition.trigger_id).toBeTruthy();
    expect(record.severity_definition.severity).toBe("HIGH");
    expect(record.routing_definition.routing_target).toBe("GOVERNANCE_REVIEW");
    expect(record.evidence_references.evidence_ids.length).toBeGreaterThanOrEqual(3);
    expect(record.replay_metadata.replay_id).toBeTruthy();
    expect(record.truth_ledger_reference.truth_record_reference).toBeTruthy();
    expect(record.certification_metadata.contract_version).toBe("ESCALATION-CONTRACT-V1");
    expect(validation.validation_state).toBe("VALID");
  });

  it("rejects missing or unsupported triggers", () => {
    const missing = validateEscalationContractRecord(buildEscalationContractRecord({ scenario: "MISSING_TRIGGER" }));
    const unsupported = validateEscalationContractRecord(buildEscalationContractRecord({ scenario: "UNSUPPORTED_TRIGGER" }));
    expect(missing.errors.some((error) => error.reason === "TRIGGER_MISSING")).toBe(true);
    expect(unsupported.errors.some((error) => error.reason === "UNSUPPORTED_TRIGGER")).toBe(true);
  });

  it("rejects invalid severity and missing deterministic routing", () => {
    const severity = validateEscalationContractRecord(buildEscalationContractRecord({ scenario: "INVALID_SEVERITY" }));
    const routing = validateEscalationContractRecord(buildEscalationContractRecord({ scenario: "MISSING_ROUTING" }));
    expect(severity.errors.some((error) => error.reason === "INVALID_SEVERITY")).toBe(true);
    expect(routing.errors.some((error) => error.reason === "ROUTING_TARGET_MISSING")).toBe(true);
  });

  it("enforces evidence completeness and lineage preservation", () => {
    const evidence = validateEscalationContractRecord(buildEscalationContractRecord({ scenario: "INCOMPLETE_EVIDENCE" }));
    const lineage = validateEscalationContractRecord(buildEscalationContractRecord({ scenario: "BROKEN_LINEAGE" }));
    expect(evidence.errors.some((error) => error.reason === "EVIDENCE_INCOMPLETE")).toBe(true);
    expect(lineage.errors.some((error) => error.reason === "LINEAGE_BROKEN")).toBe(true);
  });

  it("enforces confidence reproducibility, governance context, and Truth Ledger linkage", () => {
    const record = buildEscalationContractRecord();
    expect(validateEscalationContractRecord(record).checks.confidence_valid).toBe(true);
    expect(validateEscalationContractRecord({ ...record, confidence_metadata: { ...record.confidence_metadata, confidence_hash: "tampered" } }).errors.some((error) => error.reason === "CONFIDENCE_HASH_MISMATCH")).toBe(true);
    expect(validateEscalationContractRecord({ ...record, governance_context: { ...record.governance_context, constitutional_context: [] } }).errors.some((error) => error.reason === "GOVERNANCE_CONTEXT_MISSING")).toBe(true);
    expect(validateEscalationContractRecord(buildEscalationContractRecord({ scenario: "LEDGER_MISSING" })).errors.some((error) => error.reason === "TRUTH_LEDGER_MISSING")).toBe(true);
  });

  it("replays escalation contract deterministically and detects replay/hash mismatch", () => {
    const record = buildEscalationContractRecord();
    expect(computeEscalationHash(record)).toBe(record.escalation_hash);
    expect(replayEscalationContract(record).replay_state).toBe("REPRODUCED");
    expect(validateEscalationContractRecord(buildEscalationContractRecord({ scenario: "REPLAY_MISMATCH" })).validation_state).toBe("REPLAY_MISMATCH");
    expect(replayEscalationContract(buildEscalationContractRecord({ scenario: "HASH_MISMATCH" })).replay_state).toBe("MISMATCH");
  });

  it("preserves tenant isolation and blocks cross-tenant references", () => {
    expect(validateEscalationContractRecord(buildEscalationContractRecord()).checks.tenant_isolated).toBe(true);
    const validation = validateEscalationContractRecord(buildEscalationContractRecord({ scenario: "CROSS_TENANT" }));
    expect(validation.validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(validation.errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION")).toBe(true);
  });

  it("enforces advisory-only behavior and blocks execution or authority expansion", () => {
    const execution = validateEscalationContractRecord(buildEscalationContractRecord({ scenario: "EXECUTION_AUTHORITY" }));
    const authority = validateEscalationContractRecord(buildEscalationContractRecord({ scenario: "AUTHORITY_EXPANSION" }));
    expect(execution.validation_state).toBe("CERTIFICATION_BLOCKED");
    expect(execution.errors.some((error) => error.reason === "EXECUTION_AUTHORITY_DETECTED")).toBe(true);
    expect(authority.errors.some((error) => error.reason === "AUTHORITY_EXPANSION_DETECTED")).toBe(true);
  });

  it("detects immutable identity mutation, hidden state, unsupported type, invalid state, and malformed ledger sequence", () => {
    const record = buildEscalationContractRecord();
    expect(validateEscalationContractRecord({ ...record, tenant_id: "tenant_alpha_changed" }, { original_record: record }).errors.some((error) => error.reason === "IMMUTABLE_IDENTITY_MUTATION")).toBe(true);
    expect(validateEscalationContractRecord({ ...record, hidden_escalation_state: true } as never).validation_state).toBe("CERTIFICATION_BLOCKED");
    expect(validateEscalationContractRecord({ ...record, escalation_type: "BAD" as never }).errors.some((error) => error.reason === "UNSUPPORTED_ESCALATION_TYPE")).toBe(true);
    expect(validateEscalationContractRecord({ ...record, state: "BAD" as never }).errors.some((error) => error.reason === "INVALID_STATE")).toBe(true);
    expect(validateEscalationContractRecord({ ...record, truth_ledger_reference: { ...record.truth_ledger_reference, ledger_sequence: 0 } }).errors.some((error) => error.reason === "INVALID_LEDGER_SEQUENCE")).toBe(true);
  });

  it("allows deterministic append-only lifecycle transitions and blocks invalid ones", () => {
    const record = buildEscalationContractRecord();
    expect(transitionEscalationState(record, "PRIORITIZED").allowed).toBe(true);
    expect(transitionEscalationState(record, "ARCHIVED").allowed).toBe(false);
  });

  it("exposes operator observability for trigger, evidence, severity, routing, governance, confidence, replay, ledger, and advisory notice", () => {
    const surface = buildEscalationObservabilitySurface();
    expect(surface.escalation_id).toMatch(/^ESC-7F1-/);
    expect(surface.trigger_reason).toContain("Policy evidence");
    expect(surface.evidence_basis.length).toBeGreaterThan(0);
    expect(surface.governance_context.constitutional_context.length).toBeGreaterThan(0);
    expect(surface.confidence.score).toBe(91);
    expect(surface.replay_state).toBe("REPRODUCED");
    expect(surface.ledger_reference.truth_record_reference).toBeTruthy();
    expect(surface.advisory_only_notice).toContain("recommend governance attention only");
  });
});
