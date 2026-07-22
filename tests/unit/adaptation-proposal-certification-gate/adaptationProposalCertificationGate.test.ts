import { describe, expect, it } from "vitest";
import {
  certifyAdaptationProposalEngine,
  getAdaptationProposalCertificationFoundation,
  replayAdaptationProposalCertification,
} from "@/services/adaptation-proposal-certification-gate";
import type {
  AdaptationProposalCertificationArea,
  AdaptationProposalCertificationFailure,
  AdaptationProposalCertificationScenario,
} from "@/types/adaptation-proposal-certification-gate";

describe("Mission Control Phase 10.10.12 Adaptation Proposal Certification Gate", () => {
  const expectedAreas: readonly AdaptationProposalCertificationArea[] = [
    "PROPOSAL_GENERATION",
    "EVIDENCE_LINEAGE",
    "REPLAY",
    "SCORING_PRIORITIZATION",
    "SUPPRESSION_CONSOLIDATION",
    "GOVERNANCE_CONSTITUTIONAL",
    "OPERATOR_SAFETY",
    "INTEGRITY_SECURITY",
    "LIFECYCLE",
    "EXPLAINABILITY",
  ];

  it("publishes the adaptation proposal certification contract", () => {
    const foundation = getAdaptationProposalCertificationFoundation();

    expect(foundation.adaptation_proposal_certification_gate_version).toBe("adaptation-proposal-certification-gate/v1");
    expect(foundation.api_surface.certify_engine).toBe("POST /adaptation-proposal-certification-gate/certify");
    expect(foundation.api_surface.implementation_authorization_supported).toBe(false);
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.supported_outcomes).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(foundation.certification_areas).toEqual(expectedAreas);
    expect(foundation.result.certification_outcome).toBe("PASS");
  });

  it("certifies deterministically", () => {
    const first = certifyAdaptationProposalEngine();
    const second = certifyAdaptationProposalEngine();

    expect(first.certification_tests.map((test) => test.integrity_hash)).toEqual(second.certification_tests.map((test) => test.integrity_hash));
    expect(first.summary.integrity_hash).toBe(second.summary.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("passes when every mandatory test passes", () => {
    const result = certifyAdaptationProposalEngine();

    expect(result.certification_outcome).toBe("PASS");
    expect(result.failures).toEqual([]);
    expect(result.certification_tests.every((test) => test.actual === "PASS")).toBe(true);
    expect(result.summary.progression_to_phase_10_11_authorized).toBe(true);
    expect(result.summary.production_readiness_status).toBe("READY_FOR_PHASE_10_11");
    expect(result.metrics.certification_completion_percentage).toBe(100);
  });

  it("produces required deliverables", () => {
    const deliverables = certifyAdaptationProposalEngine().deliverables;
    const titles = deliverables.map((deliverable) => deliverable.title);

    expect(titles).toContain("Adaptation Proposal Certification Test Suite");
    expect(titles).toContain("Proposal Determinism Report");
    expect(titles).toContain("Proposal Integrity Report");
    expect(titles).toContain("Proposal Explainability Report");
    expect(titles).toContain("Governance Compliance Report");
    expect(titles).toContain("Constitutional Compliance Report");
    expect(titles).toContain("Production Readiness Report");
    expect(titles).toContain("Certification Summary Report");
    expect(deliverables.every((deliverable) => deliverable.integrity_hash)).toBe(true);
  });

  it("returns conditional pass only for non-mandatory documentation or observability deficiencies", () => {
    const result = certifyAdaptationProposalEngine({ scenario: "CONDITIONAL_DOCUMENTATION" });

    expect(result.certification_outcome).toBe("CONDITIONAL_PASS");
    expect(result.failures).toEqual(["DOCUMENTATION_OBSERVABILITY_DEFICIENCY"]);
    expect(result.summary.progression_to_phase_10_11_authorized).toBe(false);
    expect(result.summary.production_readiness_status).toBe("CONDITIONAL_BLOCKED");
    expect(result.metrics.production_readiness_status).toBe("CONDITIONAL_BLOCKED");
  });

  it("publishes certification observability metrics", () => {
    const metrics = certifyAdaptationProposalEngine().metrics;

    expect(metrics.certification_status).toBe("PASS");
    expect(metrics.proposal_determinism_rate).toBe(1);
    expect(metrics.replay_success_rate).toBe(1);
    expect(metrics.lineage_completeness).toBe(1);
    expect(metrics.validation_success_rate).toBe(1);
    expect(metrics.governance_compliance_rate).toBe(1);
    expect(metrics.constitutional_compliance_rate).toBe(1);
    expect(metrics.authority_compliance_rate).toBe(1);
    expect(metrics.operator_safety_compliance).toBe(1);
    expect(metrics.integrity_verification_success).toBe(1);
    expect(metrics.tenant_isolation_verification).toBe(1);
  });

  it("preserves governance, constitutional, authority, operator, and advisory-only guarantees", () => {
    const result = certifyAdaptationProposalEngine();

    expect(result.governance_supremacy_preserved).toBe(true);
    expect(result.constitutional_enforcement_preserved).toBe(true);
    expect(result.authority_preservation_enforced).toBe(true);
    expect(result.operator_first_design_verified).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.authorizes_implementation).toBe(false);
    expect(result.authorizes_production_mutation).toBe(false);
    expect(result.changes_production_behavior).toBe(false);
    expect(result.summary.authorizes_implementation).toBe(false);
  });

  it.each([
    ["NONDETERMINISTIC_GENERATION", "NONDETERMINISTIC_PROPOSAL_GENERATION"],
    ["IDENTITY_COLLISION", "PROPOSAL_IDENTITY_COLLISION"],
    ["SCHEMA_FAILURE", "PROPOSAL_SCHEMA_VALIDATION_FAILED"],
    ["MISSING_EVIDENCE", "EVIDENCE_REFERENCES_INCOMPLETE"],
    ["LINEAGE_INCOMPLETE", "PROPOSAL_LINEAGE_INCOMPLETE"],
    ["REPLAY_FAILURE", "REPLAY_RECONSTRUCTION_FAILED"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["AUTHORITY_FAILURE", "AUTHORITY_BOUNDARY_VIOLATED"],
    ["SCORING_NONDETERMINISTIC", "SCORING_NONDETERMINISTIC"],
    ["PRIORITIZATION_NONDETERMINISTIC", "PRIORITIZATION_NONDETERMINISTIC"],
    ["SUPPRESSION_INCONSISTENT", "SUPPRESSION_INCONSISTENT"],
    ["CONSOLIDATION_LINEAGE_LOST", "CONSOLIDATION_LINEAGE_LOST"],
    ["LIFECYCLE_INCONSISTENT", "LIFECYCLE_INCONSISTENT"],
    ["EXPLAINABILITY_INCOMPLETE", "EXPLAINABILITY_INCOMPLETE"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["LEDGER_FAILURE", "IMMUTABLE_LEDGER_GUARANTEE_FAILED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_FAILED"],
    ["PROPOSAL_MUTATION", "UNAUTHORIZED_PROPOSAL_MUTATION"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATED"],
    ["PRODUCTION_MUTATION", "DIRECT_PRODUCTION_MUTATION_POSSIBLE"],
  ] as readonly [AdaptationProposalCertificationScenario, AdaptationProposalCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = certifyAdaptationProposalEngine({ scenario });

    expect(result.certification_outcome).toBe("FAIL");
    expect(result.failures).toContain(failure);
    expect(result.summary.progression_to_phase_10_11_authorized).toBe(false);
    expect(result.metrics.production_readiness_status).toBe("BLOCKED");
    expect(result.certification_tests.some((test) => test.actual === "FAIL")).toBe(true);
    expect(result.authorizes_implementation).toBe(false);
  });

  it("replays certification and detects tampering", () => {
    const result = certifyAdaptationProposalEngine();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptationProposalCertification(result)).toBe(true);
    expect(replayAdaptationProposalCertification(tampered)).toBe(false);
  });
});
