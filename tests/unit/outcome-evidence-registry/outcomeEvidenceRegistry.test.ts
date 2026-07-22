import { describe, expect, it } from "vitest";
import {
  OUTCOME_EVIDENCE_LIFECYCLE,
  OUTCOME_EVIDENCE_REGISTRY_CHECKS,
  OUTCOME_EVIDENCE_TYPES,
  computeOutcomeEvidenceRegistryHash,
  getOutcomeEvidenceRegistryFoundation,
  replayOutcomeEvidenceRegistry,
  runOutcomeEvidenceRegistry,
} from "@/services/outcome-evidence-registry";
import type { OutcomeEvidenceRegistryFailure, OutcomeEvidenceRegistryInput } from "@/types/outcome-evidence-registry";

describe("Mission Control Phase 10.1.4 Outcome Evidence Registry", () => {
  it("publishes the outcome evidence registry foundation", () => {
    const foundation = getOutcomeEvidenceRegistryFoundation();

    expect(foundation.outcome_evidence_registry_version).toBe("outcome-evidence-registry/v1");
    expect(foundation.checks).toEqual(OUTCOME_EVIDENCE_REGISTRY_CHECKS);
    expect(foundation.evidence_types).toEqual(OUTCOME_EVIDENCE_TYPES);
    expect(foundation.lifecycle).toEqual(OUTCOME_EVIDENCE_LIFECYCLE);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("registers immutable evidence records from existing outcome observation evidence refs", () => {
    const result = runOutcomeEvidenceRegistry();

    expect(result.evidence_registry.length).toBeGreaterThan(0);
    expect(result.evidence_registry[0].immutable_reference).toBe(true);
    expect(result.evidence_registry[0].original_evidence_altered).toBe(false);
    expect(result.creates_evidence).toBe(false);
    expect(result.registry_only).toBe(true);
  });

  it("creates deterministic evidence identities and replay hashes", () => {
    const result = runOutcomeEvidenceRegistry();

    expect(computeOutcomeEvidenceRegistryHash(result.evidence_registry[0])).toBe(result.evidence_registry[0].integrity_hash);
    expect(replayOutcomeEvidenceRegistry(result)).toBe(true);
  });

  it.each([
    ["OPERATIONAL_REPORT", "OPERATIONAL_REPORT"],
    ["OPERATOR_EVIDENCE", "OPERATOR_EVIDENCE"],
    ["GOVERNANCE_EVIDENCE", "GOVERNANCE_EVIDENCE"],
    ["MISSION_EVIDENCE", "MISSION_EVIDENCE"],
    ["ROLLBACK_EVIDENCE", "ROLLBACK_EVIDENCE"],
    ["AUDIT_REFERENCE", "AUDIT_REFERENCE"],
    ["SIMULATION_REFERENCE", "SIMULATION_REFERENCE"],
    ["EXTERNAL_VERIFIED_EVIDENCE", "EXTERNAL_VERIFIED_EVIDENCE"],
  ] as const)("supports %s evidence registration", (scenario, evidenceType) => {
    const result = runOutcomeEvidenceRegistry({ scenario });

    expect(result.evidence_registry[0].evidence_type).toBe(evidenceType);
    expect(result.validation.validation_status).toBe("VALID");
  });

  it("links evidence to outcome, decision, mission, operator, governance, rollback, replay, and truth ledger artifacts", () => {
    const result = runOutcomeEvidenceRegistry();

    expect(result.relationship_index.outcome_links.length).toBeGreaterThan(0);
    expect(result.relationship_index.decision_links.length).toBeGreaterThan(0);
    expect(result.relationship_index.mission_links.length).toBeGreaterThan(0);
    expect(result.relationship_index.operator_links.length).toBeGreaterThan(0);
    expect(result.relationship_index.governance_links.length).toBeGreaterThan(0);
    expect(result.relationship_index.rollback_links.length).toBeGreaterThan(0);
    expect(result.relationship_index.replay_links.length).toBeGreaterThan(0);
    expect(result.relationship_index.truth_ledger_links.length).toBeGreaterThan(0);
    expect(result.relationship_index.deterministic).toBe(true);
  });

  it("tracks complete evidence lineage and replay reconstruction order", () => {
    const result = runOutcomeEvidenceRegistry();

    expect(result.lineage_tracker[0].parent_refs.length).toBeGreaterThan(0);
    expect(result.lineage_tracker[0].supporting_refs.length).toBeGreaterThan(0);
    expect(result.lineage_tracker[0].replay_refs.length).toBeGreaterThan(0);
    expect(result.replay_index.reconstruction_order).toEqual([...result.replay_index.evidence_ids].sort());
  });

  it("records append-only evidence ledger entries", () => {
    const result = runOutcomeEvidenceRegistry();

    expect(result.evidence_ledger.length).toBe(result.evidence_registry.length);
    expect(result.evidence_ledger[0].append_only).toBe(true);
    expect(result.evidence_ledger[0].deleted).toBe(false);
    expect(result.evidence_ledger[0].lifecycle_state).toBe("REPLAYABLE");
  });

  it("keeps metrics advisory-only and outside certification decisions", () => {
    const result = runOutcomeEvidenceRegistry();

    expect(result.metrics.evidence_records_registered).toBe(result.evidence_registry.length);
    expect(result.metrics.replay_reconstruction_success_rate).toBe(1);
    expect(result.metrics.advisory_only).toBe(true);
    expect(result.audit_report.certification_decision).toBe("PASS");
  });

  it("certifies the registry as adaptive intelligence ready only when evidence is valid", () => {
    const result = runOutcomeEvidenceRegistry();

    expect(result.audit_report.registry_operational).toBe(true);
    expect(result.audit_report.linker_operational).toBe(true);
    expect(result.audit_report.validator_operational).toBe(true);
    expect(result.audit_report.lineage_tracker_operational).toBe(true);
    expect(result.audit_report.adaptive_intelligence_ready).toBe(true);
  });

  it.each([
    ["NO_EVIDENCE", "OUTCOME_ACCEPTED_WITHOUT_EVIDENCE"],
    ["MISSING_REFERENCE", "EVIDENCE_REFERENCE_MISSING"],
    ["DUPLICATE_EVIDENCE_ID", "DUPLICATE_EVIDENCE_ID_ACCEPTED"],
    ["UNAUTHORIZED_SOURCE", "UNAUTHORIZED_EVIDENCE_SOURCE_ACCEPTED"],
    ["INTEGRITY_FAILURE", "EVIDENCE_INTEGRITY_VERIFICATION_FAILED"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_LINEAGE_INCOMPLETE"],
    ["BROKEN_LINEAGE", "LINEAGE_GRAPH_BROKEN"],
    ["NONDETERMINISTIC_RELATIONSHIP", "EVIDENCE_RELATIONSHIP_NONDETERMINISTIC"],
    ["MODIFIED_AFTER_REGISTRATION", "EVIDENCE_MODIFIED_AFTER_REGISTRATION"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["ORPHAN_EVIDENCE", "ORPHAN_EVIDENCE_RECORD_CREATED"],
    ["INVALID_OBSERVATION", "OBSERVATION_NOT_VALIDATED"],
    ["INFERRED_EVIDENCE", "EVIDENCE_INFERRED"],
    ["ORIGINAL_EVIDENCE_ALTERED", "ORIGINAL_EVIDENCE_ALTERED"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_GOVERNANCE_BYPASSED"],
    ["FAIL_OPEN", "FAIL_OPEN_EVIDENCE_REGISTRY_BEHAVIOR"],
  ] as readonly [NonNullable<OutcomeEvidenceRegistryInput["scenario"]>, OutcomeEvidenceRegistryFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runOutcomeEvidenceRegistry({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.audit_report.certification_decision).toBe("FAIL");
    expect(result.metrics.advisory_only).toBe(true);
    expect(result.creates_evidence).toBe(false);
  });

  it("fails closed when the role lacks evidence registry visibility", () => {
    const result = runOutcomeEvidenceRegistry({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects registry tampering during replay", () => {
    const result = runOutcomeEvidenceRegistry();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOutcomeEvidenceRegistry(tampered)).toBe(false);
  });
});
