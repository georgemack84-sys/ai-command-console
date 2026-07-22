import { describe, expect, it } from "vitest";
import { getProvingEvidenceAggregationQualificationLedgerBundle, replayProvingEvidenceAggregationQualificationLedger, runProvingEvidenceAggregationQualificationLedger, validateProvingEvidenceAggregationQualificationLedger } from "@/services/proving-evidence-aggregation-qualification-ledger";
import type { EvidenceFailure } from "@/types/proving-evidence-aggregation-qualification-ledger";

const FAILURE_MATRIX: readonly EvidenceFailure[] = [
  "P6_14_CONTINUOUS_VALIDATION_INVALID",
  "EVIDENCE_COLLECTION_FRAMEWORK_MISSING",
  "EVIDENCE_SOURCE_MISSING",
  "EVIDENCE_VALIDATION_ENGINE_MISSING",
  "CONSTITUTIONAL_COMPLIANCE_INVALID",
  "EVIDENCE_AGGREGATION_ENGINE_MISSING",
  "AGGREGATION_DIMENSION_MISSING",
  "LINEAGE_ENGINE_MISSING",
  "IMMUTABLE_LEDGER_MISSING",
  "QUALIFICATION_EVIDENCE_MANAGER_MISSING",
  "QUALIFICATION_PACKAGE_INCOMPLETE",
  "EVIDENCE_REGISTRY_MISSING",
  "REGISTRY_INDEX_INCOMPLETE",
  "REPLAY_ASSOCIATION_MISSING",
  "FEDERATED_EVIDENCE_GRAPH_MISSING",
  "CROSS_PROGRAM_EVIDENCE_MISSING",
  "AUDIT_TRACEABILITY_INCOMPLETE",
  "EVIDENCE_GOVERNANCE_POLICY_MISSING",
  "RETENTION_POLICY_MISSING",
  "EVIDENCE_AUTHORITY_VIOLATED",
  "QUALIFICATION_LEDGER_DECISION_MISSING",
];

describe("P6.15 Evidence Aggregation and Qualification Ledger", () => {
  it("publishes evidence ledger doctrine and validates the baseline", () => {
    const bundle = getProvingEvidenceAggregationQualificationLedgerBundle();

    expect(bundle.doctrine.version).toBe("proving-evidence-aggregation-qualification-ledger/v6.15");
    expect(bundle.doctrine.owns_proving_evidence).toBe(true);
    expect(bundle.doctrine.owns_qualification_evidence).toBe(true);
    expect(bundle.doctrine.owns_evidence_aggregation).toBe(true);
    expect(bundle.doctrine.owns_lineage).toBe(true);
    expect(bundle.doctrine.owns_immutable_ledger).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic evidence aggregation with the P6.14 dependency", () => {
    const first = runProvingEvidenceAggregationQualificationLedger();
    const second = runProvingEvidenceAggregationQualificationLedger();

    expect(first.phase_identifier).toBe("ProvingEvidenceAggregationQualificationLedger");
    expect(first.continuous_validation_ref).toBe("proving-continuous-proving-regression-validation/v6.14");
    expect(first.collection.categories).toHaveLength(15);
    expect(first.aggregated_package.dimensions).toHaveLength(8);
    expect(first.ledger.records).toHaveLength(9);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingEvidenceAggregationQualificationLedger(first).valid).toBe(true);
    expect(replayProvingEvidenceAggregationQualificationLedger(first)).toBe(true);
  });

  it("produces collection, validation, aggregation, lineage, and immutable ledger artifacts", () => {
    const result = runProvingEvidenceAggregationQualificationLedger();

    expect(result.collection.continuous_validation).toBe(true);
    expect(result.validation_engine.integrity).toBe(true);
    expect(result.validation_engine.provenance).toBe(true);
    expect(result.aggregated_package.qualification_ready).toBe(true);
    expect(result.lineage_graph.complete).toBe(true);
    expect(result.ledger.append_only).toBe(true);
    expect(result.ledger.immutable).toBe(true);
    expect(result.ledger.cryptographically_verifiable).toBe(true);
    expect(result.ledger.replay_linked).toBe(true);
  });

  it("produces registry, replay, federation, audit, governance, and qualification package outputs", () => {
    const result = runProvingEvidenceAggregationQualificationLedger();

    expect(result.qualification_evidence.package_complete).toBe(true);
    expect(result.registry.searchable).toBe(true);
    expect(result.replay_references.deterministic_replay_preserved).toBe(true);
    expect(result.federated_graph.program_1_capability).toBe(true);
    expect(result.federated_graph.program_5_trust).toBe(true);
    expect(result.audit_report.immutable_history).toBe(true);
    expect(result.governance_policy.enforced).toBe(true);
    expect(result.decision.program_qualification_supply_authorized).toBe(true);
  });

  it("passes all P6.15 gates and readiness checks", () => {
    const result = runProvingEvidenceAggregationQualificationLedger();

    expect(result.gates.collection_gate).toBe(true);
    expect(result.gates.validation_gate).toBe(true);
    expect(result.gates.aggregation_gate).toBe(true);
    expect(result.gates.lineage_gate).toBe(true);
    expect(result.gates.ledger_gate).toBe(true);
    expect(result.gates.registry_gate).toBe(true);
    expect(result.gates.replay_gate).toBe(true);
    expect(result.gates.federation_gate).toBe(true);
    expect(result.gates.qualification_gate).toBe(true);
    expect(result.gates.audit_gate).toBe(true);
    expect(result.gates.governance_gate).toBe(true);
    expect(result.gates.passed).toBe(true);
    expect(result.readiness.outcome).toBe("PASS");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(FAILURE_MATRIX)("fails evidence ledger readiness for %s", (failure) => {
    const result = runProvingEvidenceAggregationQualificationLedger({ scenario: failure });
    const validation = validateProvingEvidenceAggregationQualificationLedger(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it.each(["EVIDENCE_INTEGRITY_INVALID", "EVIDENCE_COMPLETENESS_INVALID", "EVIDENCE_SIGNATURE_INVALID", "EVIDENCE_TIMESTAMP_INVALID", "EVIDENCE_PROVENANCE_INVALID", "REPLAY_REFERENCE_MISSING", "LINEAGE_GRAPH_INCOMPLETE", "LEDGER_APPEND_ONLY_VIOLATED", "LEDGER_CRYPTOGRAPHIC_VERIFICATION_FAILED", "FAIL_CLOSED_NOT_ENFORCED"] as const)("fails closed for %s", (failure) => {
    const result = runProvingEvidenceAggregationQualificationLedger({ scenario: failure });

    expect(result.readiness.outcome).toBe("FAIL_CLOSED");
    expect(result.decision.fail_closed).toBe(true);
    expect(result.decision.qualification_package_authorized).toBe(false);
    expect(result.decision.program_qualification_supply_authorized).toBe(false);
    expect(validateProvingEvidenceAggregationQualificationLedger(result).valid).toBe(false);
  });

  it("supports pass with observations but keeps conditional follow-up out of full readiness", () => {
    const observed = runProvingEvidenceAggregationQualificationLedger({ scenario: "PASS_WITH_OBSERVATIONS" });
    const conditional = runProvingEvidenceAggregationQualificationLedger({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.outcome).toBe("PASS_WITH_OBSERVATIONS");
    expect(observed.readiness.phase_ready).toBe(true);
    expect(validateProvingEvidenceAggregationQualificationLedger(observed).valid).toBe(true);
    expect(conditional.readiness.outcome).toBe("CONDITIONAL_PASS");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
