import { describe, expect, it } from "vitest";
import {
  certifyGovernanceAdaptationLayer,
  getGovernanceAdaptationCertificationGateFoundation,
  replayGovernanceAdaptationCertification,
} from "@/services/governance-adaptation-certification-gate";
import type {
  GovernanceAdaptationCertificationFailure,
  GovernanceAdaptationCertificationOutcome,
  GovernanceAdaptationCertificationScenario,
} from "@/types/governance-adaptation-certification-gate";

describe("Mission Control Phase 10.8.10 Governance-Aware Adaptation Certification Gate", () => {
  it("publishes the governance adaptation certification gate foundation", () => {
    const foundation = getGovernanceAdaptationCertificationGateFoundation();

    expect(foundation.governance_adaptation_certification_gate_version).toBe("governance-adaptation-certification-gate/v1");
    expect(foundation.api_surface.certify_layer).toBe("POST /governance-adaptation-certification-gate/certify");
    expect(foundation.api_surface.recommendation_approval_supported).toBe(false);
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.result.final_certification_decision).toBe("PASS");
  });

  it("certifies the integrated governance-aware adaptation layer deterministically", () => {
    const first = certifyGovernanceAdaptationLayer({ scenario: "BASELINE" });
    const second = certifyGovernanceAdaptationLayer({ scenario: "BASELINE" });

    expect(first.certification.certification_id).toBe(second.certification.certification_id);
    expect(first.certification.integrity_hash).toBe(second.certification.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.pass).toBe(true);
  });

  it("certifies all 10.8 modules and the certification matrix", () => {
    const result = certifyGovernanceAdaptationLayer();

    expect(result.certification.module_results).toHaveLength(9);
    expect(result.certification.certification_evidence.length).toBeGreaterThanOrEqual(20);
    expect(result.certification.module_results.every((module) => module.status === "PASS")).toBe(true);
    expect(result.certification.certification_evidence.every((test) => test.actual === "PASS")).toBe(true);
  });

  it("keeps the gate advisory-only and blocks production mutation support", () => {
    const result = certifyGovernanceAdaptationLayer();

    expect(result.advisory_only).toBe(true);
    expect(result.production_safe).toBe(true);
    expect(result.audit_ready).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.immutable).toBe(true);
  });

  it.each([
    ["BASELINE", "PASS"],
    ["CONDITIONAL_PASS", "CONDITIONAL_PASS"],
  ] as readonly [GovernanceAdaptationCertificationScenario, GovernanceAdaptationCertificationOutcome][])("returns %s for %s", (scenario, outcome) => {
    const result = certifyGovernanceAdaptationLayer({ scenario });

    expect(result.final_certification_decision).toBe(outcome);
    expect(result.fail).toBe(false);
  });

  it.each([
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_POSSIBLE"],
    ["CONSTITUTIONAL_WEAKENED", "CONSTITUTIONAL_PROTECTIONS_WEAKENED"],
    ["HUMAN_AUTHORITY_REDUCED", "HUMAN_AUTHORITY_REDUCED"],
    ["GOVERNANCE_SUPREMACY_COMPROMISED", "GOVERNANCE_SUPREMACY_COMPROMISED"],
    ["OPERATOR_SUPREMACY_WEAKENED", "OPERATOR_SUPREMACY_WEAKENED"],
    ["AUTHORITY_EXPANSION_PERMITTED", "AUTHORITY_EXPANSION_PERMITTED"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION_SUCCEEDED"],
    ["CROSS_TENANT_ADAPTATION", "CROSS_TENANT_ADAPTATION_POSSIBLE"],
    ["POLICY_CONFLICT_INCOMPLETE", "POLICY_CONFLICT_DETECTION_INCOMPLETE"],
    ["EVIDENCE_UNVERIFIABLE", "EVIDENCE_INSUFFICIENT_OR_UNVERIFIABLE"],
    ["CERTIFICATION_DEPENDENCY_UNRESOLVED", "CERTIFICATION_DEPENDENCIES_UNRESOLVED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["AUDIT_DEGRADATION", "AUDITABILITY_DEGRADED"],
    ["ROLLBACK_UNAVAILABLE", "ROLLBACK_UNAVAILABLE"],
    ["EXPLAINABILITY_INCOMPLETE", "EXPLAINABILITY_INCOMPLETE"],
    ["LINEAGE_INCOMPLETE", "GOVERNANCE_LINEAGE_INCOMPLETE"],
    ["LEDGER_INTEGRITY_FAILURE", "LEDGER_INTEGRITY_FAILED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_VERIFICATION_FAILED"],
    ["NONDETERMINISTIC", "DETERMINISTIC_EXECUTION_UNREPRODUCIBLE"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_BEHAVIOR_VIOLATED"],
    ["PRODUCTION_MUTATION", "PRODUCTION_MUTATION_POSSIBLE"],
  ] as readonly [GovernanceAdaptationCertificationScenario, GovernanceAdaptationCertificationFailure][])("fails certification for %s", (scenario, failure) => {
    const result = certifyGovernanceAdaptationLayer({ scenario });

    expect(result.failures).toContain(failure);
    expect(result.final_certification_decision).toBe("FAIL");
    expect(result.fail).toBe(true);
    expect(result.pass).toBe(false);
    expect(result.production_safe).toBe(false);
  });

  it("records immutable certification ledger entries", () => {
    const result = certifyGovernanceAdaptationLayer({ scenario: "BASELINE" });

    expect(result.ledger_entry.append_only).toBe(true);
    expect(result.ledger_entry.immutable).toBe(true);
    expect(result.ledger_entry.certification_id).toBe(result.certification.certification_id);
    expect(result.ledger_entry.certification_outcome).toBe("PASS");
  });

  it("replays certification output and detects tampering", () => {
    const result = certifyGovernanceAdaptationLayer({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayGovernanceAdaptationCertification(result)).toBe(true);
    expect(replayGovernanceAdaptationCertification(tampered)).toBe(false);
  });
});
