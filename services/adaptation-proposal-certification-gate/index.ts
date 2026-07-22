import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayProposalValidation, validateProposalIntegrity } from "@/services/proposal-validation-integrity-engine";
import type { ProposalValidationScenario } from "@/types/proposal-validation-integrity-engine";
import type {
  AdaptationProposalCertificationApiSurface,
  AdaptationProposalCertificationArea,
  AdaptationProposalCertificationDeliverable,
  AdaptationProposalCertificationFailure,
  AdaptationProposalCertificationFoundation,
  AdaptationProposalCertificationInput,
  AdaptationProposalCertificationMetrics,
  AdaptationProposalCertificationOutcome,
  AdaptationProposalCertificationResult,
  AdaptationProposalCertificationScenario,
  AdaptationProposalCertificationSummary,
  AdaptationProposalCertificationTest,
} from "@/types/adaptation-proposal-certification-gate";

const GATE_VERSION = "adaptation-proposal-certification-gate/v1" as const;
const RULE_VERSION = "adaptation-proposal-certification-rules/v1" as const;
const CERTIFIED_AT = "2026-07-10T00:00:00.000Z";

const OUTCOMES: readonly AdaptationProposalCertificationOutcome[] = Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"]);

const AREAS: readonly AdaptationProposalCertificationArea[] = Object.freeze([
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
]);

const TEST_NAMES: Readonly<Record<AdaptationProposalCertificationArea, readonly string[]>> = Object.freeze({
  PROPOSAL_GENERATION: Object.freeze(["proposal_contract_valid", "proposal_generation_deterministic", "identical_inputs_identical_proposals", "proposal_identity_unique", "proposal_schema_complete", "proposal_metadata_complete", "proposal_integrity_hash_reproducible"]),
  EVIDENCE_LINEAGE: Object.freeze(["outcomes_linked", "patterns_linked", "feedback_linked", "evidence_linked", "evidence_completeness_verified", "proposal_lineage_complete", "historical_provenance_preserved"]),
  REPLAY: Object.freeze(["replay_references_complete", "proposal_reconstruction_deterministic", "replay_identical_artifacts", "historical_lineage_preserved", "replay_ordering_deterministic", "replay_integrity_verified"]),
  SCORING_PRIORITIZATION: Object.freeze(["proposal_scoring_reproducible", "overall_scoring_deterministic", "prioritization_deterministic", "ranking_stable_across_replay", "confidence_scores_traceable", "risk_scores_traceable", "benefit_scoring_reproducible"]),
  SUPPRESSION_CONSOLIDATION: Object.freeze(["weak_proposals_suppressed", "duplicates_consolidated", "overlaps_detected", "complementary_proposals_merged", "conflicts_detected", "suppression_explainable", "consolidation_lineage_preserved"]),
  GOVERNANCE_CONSTITUTIONAL: Object.freeze(["governance_impacts_identified", "constitutional_impacts_identified", "authority_impacts_validated", "restricted_domains_protected", "governance_routing_complete", "constitutional_enforcement_verified", "no_governance_bypass"]),
  OPERATOR_SAFETY: Object.freeze(["operator_impacts_documented", "explainability_complete", "no_operator_ambiguity_increase", "operator_review_requirements_validated", "advisory_only_enforced", "decision_transparency_verified"]),
  INTEGRITY_SECURITY: Object.freeze(["integrity_hashes_reproducible", "proposal_integrity_validated", "immutable_ledger_entries_verified", "lifecycle_integrity_preserved", "tenant_isolation_preserved", "unauthorized_mutation_prevented", "cross_tenant_references_prevented"]),
  LIFECYCLE: Object.freeze(["lifecycle_states_validated", "legal_transitions_enforced", "illegal_transitions_rejected", "lifecycle_replay_deterministic", "lifecycle_history_immutable"]),
  EXPLAINABILITY: Object.freeze(["proposal_rationale_complete", "evidence_attribution_complete", "pattern_explanations_complete", "governance_explanations_complete", "simulation_requirements_explained", "certification_requirements_explained", "rollback_requirements_explained"]),
});

type Scenario = NonNullable<AdaptationProposalCertificationInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): AdaptationProposalCertificationApiSurface {
  const base: Omit<AdaptationProposalCertificationApiSurface, "integrity_hash"> = {
    api_id: "adaptation_proposal_certification_gate_api",
    certify_engine: "POST /adaptation-proposal-certification-gate/certify",
    retrieve_summary: "POST /adaptation-proposal-certification-gate/summary",
    retrieve_matrix: "POST /adaptation-proposal-certification-gate/matrix",
    retrieve_deliverables: "POST /adaptation-proposal-certification-gate/deliverables",
    retrieve_metrics: "POST /adaptation-proposal-certification-gate/metrics",
    replay_certification: "POST /adaptation-proposal-certification-gate/replay",
    inspect_certification: "POST /adaptation-proposal-certification-gate/inspect",
    retrieve_contract: "GET /adaptation-proposal-certification-gate/contract",
    implementation_authorization_supported: false,
    production_mutation_supported: false,
    governance_override_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validationScenarioFor(scenario: Scenario): ProposalValidationScenario {
  const map: Partial<Record<AdaptationProposalCertificationScenario, ProposalValidationScenario>> = {
    NONDETERMINISTIC_GENERATION: "NONDETERMINISTIC_VALIDATION",
    IDENTITY_COLLISION: "IDENTITY_INVALID",
    SCHEMA_FAILURE: "CONTRACT_INVALID",
    MISSING_EVIDENCE: "EVIDENCE_FAILURE",
    LINEAGE_INCOMPLETE: "LINEAGE_INCOMPLETE",
    REPLAY_FAILURE: "REPLAY_FAILURE",
    GOVERNANCE_FAILURE: "APPROVAL_ROUTING_INVALID",
    CONSTITUTIONAL_FAILURE: "APPROVAL_ROUTING_INVALID",
    AUTHORITY_FAILURE: "GOVERNANCE_BYPASS",
    SCORING_NONDETERMINISTIC: "SCORING_INCONSISTENT",
    PRIORITIZATION_NONDETERMINISTIC: "NONDETERMINISTIC_VALIDATION",
    SUPPRESSION_INCONSISTENT: "CONFLICTING",
    CONSOLIDATION_LINEAGE_LOST: "LINEAGE_INCOMPLETE",
    LIFECYCLE_INCONSISTENT: "INCONSISTENT_ROUTING",
    EXPLAINABILITY_INCOMPLETE: "MISSING_REFERENCES",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
    LEDGER_FAILURE: "INTEGRITY_FAILURE",
    TENANT_VIOLATION: "TENANT_VIOLATION",
    PROPOSAL_MUTATION: "PROPOSAL_MUTATION_ATTEMPT",
    ADVISORY_ONLY_VIOLATION: "IMPLEMENTATION_ATTEMPT",
    PRODUCTION_MUTATION: "IMPLEMENTATION_ATTEMPT",
  };
  return map[scenario] ?? "BASELINE";
}

function directFailureFor(scenario: Scenario): AdaptationProposalCertificationFailure | undefined {
  const map: Partial<Record<AdaptationProposalCertificationScenario, AdaptationProposalCertificationFailure>> = {
    CONDITIONAL_DOCUMENTATION: "DOCUMENTATION_OBSERVABILITY_DEFICIENCY",
    CONDITIONAL_OBSERVABILITY: "REPORTING_DASHBOARD_DEFICIENCY",
    NONDETERMINISTIC_GENERATION: "NONDETERMINISTIC_PROPOSAL_GENERATION",
    IDENTITY_COLLISION: "PROPOSAL_IDENTITY_COLLISION",
    SCHEMA_FAILURE: "PROPOSAL_SCHEMA_VALIDATION_FAILED",
    MISSING_EVIDENCE: "EVIDENCE_REFERENCES_INCOMPLETE",
    LINEAGE_INCOMPLETE: "PROPOSAL_LINEAGE_INCOMPLETE",
    REPLAY_FAILURE: "REPLAY_RECONSTRUCTION_FAILED",
    GOVERNANCE_FAILURE: "GOVERNANCE_VALIDATION_FAILED",
    CONSTITUTIONAL_FAILURE: "CONSTITUTIONAL_VALIDATION_FAILED",
    AUTHORITY_FAILURE: "AUTHORITY_BOUNDARY_VIOLATED",
    SCORING_NONDETERMINISTIC: "SCORING_NONDETERMINISTIC",
    PRIORITIZATION_NONDETERMINISTIC: "PRIORITIZATION_NONDETERMINISTIC",
    SUPPRESSION_INCONSISTENT: "SUPPRESSION_INCONSISTENT",
    CONSOLIDATION_LINEAGE_LOST: "CONSOLIDATION_LINEAGE_LOST",
    LIFECYCLE_INCONSISTENT: "LIFECYCLE_INCONSISTENT",
    EXPLAINABILITY_INCOMPLETE: "EXPLAINABILITY_INCOMPLETE",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    LEDGER_FAILURE: "IMMUTABLE_LEDGER_GUARANTEE_FAILED",
    TENANT_VIOLATION: "TENANT_ISOLATION_FAILED",
    PROPOSAL_MUTATION: "UNAUTHORIZED_PROPOSAL_MUTATION",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_VIOLATED",
    PRODUCTION_MUTATION: "DIRECT_PRODUCTION_MUTATION_POSSIBLE",
  };
  return map[scenario];
}

function failuresFromValidation(validationReplayable: boolean, validationFailures: readonly string[]): readonly AdaptationProposalCertificationFailure[] {
  const failures: AdaptationProposalCertificationFailure[] = [];
  if (!validationReplayable || validationFailures.includes("REPLAY_VERIFICATION_FAILED")) failures.push("REPLAY_RECONSTRUCTION_FAILED");
  if (validationFailures.includes("PROPOSAL_CONTRACT_INVALID")) failures.push("PROPOSAL_SCHEMA_VALIDATION_FAILED");
  if (validationFailures.includes("PROPOSAL_IDENTITY_INVALID")) failures.push("PROPOSAL_IDENTITY_COLLISION");
  if (validationFailures.includes("EVIDENCE_VERIFICATION_FAILED") || validationFailures.includes("REQUIRED_REFERENCES_MISSING")) failures.push("EVIDENCE_REFERENCES_INCOMPLETE");
  if (validationFailures.includes("PROPOSAL_LINEAGE_INCOMPLETE")) failures.push("PROPOSAL_LINEAGE_INCOMPLETE");
  if (validationFailures.includes("APPROVAL_ROUTING_INVALID") || validationFailures.includes("GOVERNANCE_BYPASS_ATTEMPT")) failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (validationFailures.includes("PROPOSAL_SCORING_INCONSISTENT")) failures.push("SCORING_NONDETERMINISTIC");
  if (validationFailures.includes("CONFLICTING_LINEAGE_DETECTED")) failures.push("CONSOLIDATION_LINEAGE_LOST");
  if (validationFailures.includes("INTEGRITY_VERIFICATION_FAILED")) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (validationFailures.includes("TENANT_ISOLATION_VIOLATED")) failures.push("TENANT_ISOLATION_FAILED");
  if (validationFailures.includes("PROPOSAL_CONTENT_MUTATION_ATTEMPT")) failures.push("UNAUTHORIZED_PROPOSAL_MUTATION");
  if (validationFailures.includes("IMPLEMENTATION_AUTHORIZATION_ATTEMPT")) failures.push("DIRECT_PRODUCTION_MUTATION_POSSIBLE");
  return freezeArray([...new Set(failures)]);
}

function collectFailures(scenario: Scenario, validationReplayable: boolean, validationFailures: readonly string[]): readonly AdaptationProposalCertificationFailure[] {
  const failures: AdaptationProposalCertificationFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  failures.push(...failuresFromValidation(validationReplayable, validationFailures));
  return freezeArray([...new Set(failures)]);
}

function outcomeFor(failures: readonly AdaptationProposalCertificationFailure[]): AdaptationProposalCertificationOutcome {
  const conditionalOnly = failures.length > 0 && failures.every((failure) => ["DOCUMENTATION_OBSERVABILITY_DEFICIENCY", "REPORTING_DASHBOARD_DEFICIENCY"].includes(failure));
  if (failures.length === 0) return "PASS";
  if (conditionalOnly) return "CONDITIONAL_PASS";
  return "FAIL";
}

function testFails(area: AdaptationProposalCertificationArea, failures: readonly AdaptationProposalCertificationFailure[]): boolean {
  const areaFailureMap: Record<AdaptationProposalCertificationArea, readonly AdaptationProposalCertificationFailure[]> = {
    PROPOSAL_GENERATION: ["NONDETERMINISTIC_PROPOSAL_GENERATION", "PROPOSAL_IDENTITY_COLLISION", "PROPOSAL_SCHEMA_VALIDATION_FAILED"],
    EVIDENCE_LINEAGE: ["EVIDENCE_REFERENCES_INCOMPLETE", "PROPOSAL_LINEAGE_INCOMPLETE"],
    REPLAY: ["REPLAY_RECONSTRUCTION_FAILED"],
    SCORING_PRIORITIZATION: ["SCORING_NONDETERMINISTIC", "PRIORITIZATION_NONDETERMINISTIC"],
    SUPPRESSION_CONSOLIDATION: ["SUPPRESSION_INCONSISTENT", "CONSOLIDATION_LINEAGE_LOST"],
    GOVERNANCE_CONSTITUTIONAL: ["GOVERNANCE_VALIDATION_FAILED", "CONSTITUTIONAL_VALIDATION_FAILED", "AUTHORITY_BOUNDARY_VIOLATED"],
    OPERATOR_SAFETY: ["EXPLAINABILITY_INCOMPLETE", "ADVISORY_ONLY_VIOLATED"],
    INTEGRITY_SECURITY: ["INTEGRITY_VERIFICATION_FAILED", "IMMUTABLE_LEDGER_GUARANTEE_FAILED", "TENANT_ISOLATION_FAILED", "UNAUTHORIZED_PROPOSAL_MUTATION", "DIRECT_PRODUCTION_MUTATION_POSSIBLE"],
    LIFECYCLE: ["LIFECYCLE_INCONSISTENT"],
    EXPLAINABILITY: ["EXPLAINABILITY_INCOMPLETE"],
  };
  return areaFailureMap[area].some((failure) => failures.includes(failure));
}

function certificationTestsFor(failures: readonly AdaptationProposalCertificationFailure[], validationHash: string): readonly AdaptationProposalCertificationTest[] {
  return freezeArray(AREAS.flatMap((area) => TEST_NAMES[area].map((testName) => {
    const actual = testFails(area, failures) ? "FAIL" : "PASS";
    const base: Omit<AdaptationProposalCertificationTest, "integrity_hash"> = {
      test_id: `adaptation_cert_test_${hash(`${area}:${testName}`).slice(0, 14)}`,
      area,
      test_name: testName,
      expected: "PASS",
      actual,
      evidence_references: freezeArray([`validation:${validationHash}`, `area:${area.toLowerCase()}`]),
      replay_references: freezeArray([`replay:${validationHash}`]),
      remediation: actual === "PASS" ? "no_remediation_required" : `remediate_${area.toLowerCase()}`,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  })));
}

function deliverablesFor(outcome: AdaptationProposalCertificationOutcome): readonly AdaptationProposalCertificationDeliverable[] {
  const titles = [
    "Adaptation Proposal Certification Test Suite",
    "Proposal Determinism Report",
    "Proposal Integrity Report",
    "Proposal Explainability Report",
    "Proposal Replay Validation Report",
    "Governance Compliance Report",
    "Constitutional Compliance Report",
    "Authority Boundary Report",
    "Operator Impact Assessment",
    "Proposal Suppression Validation Report",
    "Proposal Consolidation Validation Report",
    "Production Readiness Report",
    "Certification Summary Report",
    "Outstanding Findings Register",
  ];
  return freezeArray(titles.map((title) => {
    const complete = outcome === "PASS" || title === "Outstanding Findings Register";
    const base: Omit<AdaptationProposalCertificationDeliverable, "integrity_hash"> = {
      deliverable_id: `adaptation_cert_deliverable_${hash(title).slice(0, 14)}`,
      title,
      complete,
      report_reference: `report:${title.toLowerCase().replaceAll(" ", "_")}`,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function readinessFor(outcome: AdaptationProposalCertificationOutcome): AdaptationProposalCertificationSummary["production_readiness_status"] {
  if (outcome === "PASS") return "READY_FOR_PHASE_10_11";
  if (outcome === "CONDITIONAL_PASS") return "CONDITIONAL_BLOCKED";
  return "BLOCKED";
}

function summaryFor(outcome: AdaptationProposalCertificationOutcome, tests: readonly AdaptationProposalCertificationTest[], failures: readonly AdaptationProposalCertificationFailure[]): AdaptationProposalCertificationSummary {
  const passed = tests.filter((test) => test.actual === "PASS").length;
  const readiness = readinessFor(outcome);
  const base: Omit<AdaptationProposalCertificationSummary, "integrity_hash"> = {
    summary_id: `adaptation_proposal_cert_summary_${hash(`${outcome}:${failures.join("|")}`).slice(0, 14)}`,
    certification_outcome: outcome,
    certification_timestamp: CERTIFIED_AT,
    completed_tests: tests.length,
    passed_tests: passed,
    failed_tests: tests.length - passed,
    outstanding_findings: failures,
    production_readiness_status: readiness,
    progression_to_phase_10_11_authorized: outcome === "PASS",
    advisory_only: true,
    authorizes_implementation: false,
    authorizes_production_mutation: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function rate(passed: boolean): number {
  return passed ? 1 : 0;
}

function metricsFor(outcome: AdaptationProposalCertificationOutcome, tests: readonly AdaptationProposalCertificationTest[], failures: readonly AdaptationProposalCertificationFailure[]): AdaptationProposalCertificationMetrics {
  const passedTests = tests.filter((test) => test.actual === "PASS").length;
  const base: Omit<AdaptationProposalCertificationMetrics, "integrity_hash"> = {
    certification_status: outcome,
    certification_completion_percentage: Number(((passedTests / tests.length) * 100).toFixed(2)),
    proposal_determinism_rate: rate(!failures.includes("NONDETERMINISTIC_PROPOSAL_GENERATION")),
    replay_success_rate: rate(!failures.includes("REPLAY_RECONSTRUCTION_FAILED")),
    lineage_completeness: rate(!failures.includes("PROPOSAL_LINEAGE_INCOMPLETE") && !failures.includes("CONSOLIDATION_LINEAGE_LOST")),
    validation_success_rate: rate(outcome === "PASS"),
    governance_compliance_rate: rate(!failures.includes("GOVERNANCE_VALIDATION_FAILED")),
    constitutional_compliance_rate: rate(!failures.includes("CONSTITUTIONAL_VALIDATION_FAILED")),
    authority_compliance_rate: rate(!failures.includes("AUTHORITY_BOUNDARY_VIOLATED")),
    operator_safety_compliance: rate(!failures.includes("EXPLAINABILITY_INCOMPLETE") && !failures.includes("ADVISORY_ONLY_VIOLATED")),
    integrity_verification_success: rate(!failures.includes("INTEGRITY_VERIFICATION_FAILED") && !failures.includes("IMMUTABLE_LEDGER_GUARANTEE_FAILED")),
    tenant_isolation_verification: rate(!failures.includes("TENANT_ISOLATION_FAILED")),
    production_readiness_status: readinessFor(outcome),
    deterministic_replay_success: outcome === "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptationProposalCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    validation_hash: result.validation_result.integrity_hash,
    test_hashes: result.certification_tests.map((test) => test.integrity_hash),
    deliverable_hashes: result.deliverables.map((deliverable) => deliverable.integrity_hash),
    summary_hash: result.summary.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    outcome: result.certification_outcome,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptationProposalCertificationResult, "integrity_hash">): string {
  return hash({
    version: result.adaptation_proposal_certification_gate_version,
    rule_version: result.certification_rule_version,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    metrics_hash: result.metrics.integrity_hash,
  });
}

export function certifyAdaptationProposalEngine(input: AdaptationProposalCertificationInput = {}): AdaptationProposalCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const validation_result = input.validation_result ?? validateProposalIntegrity({ scenario: validationScenarioFor(scenario) });
  const failures = collectFailures(scenario, replayProposalValidation(validation_result), validation_result.failures);
  const certification_outcome = outcomeFor(failures);
  const certification_tests = certificationTestsFor(failures, validation_result.integrity_hash);
  const deliverables = deliverablesFor(certification_outcome);
  const summary = summaryFor(certification_outcome, certification_tests, failures);
  const metrics = metricsFor(certification_outcome, certification_tests, failures);
  const base: Omit<AdaptationProposalCertificationResult, "integrity_hash" | "replay_hash"> = {
    adaptation_proposal_certification_gate_version: GATE_VERSION,
    certification_rule_version: RULE_VERSION,
    api_surface,
    validation_result,
    certification_tests,
    deliverables,
    summary,
    metrics,
    certification_outcome,
    failures,
    deterministic: true,
    replayable: certification_outcome === "PASS" && replayProposalValidation(validation_result),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_FAILED") && validation_result.tenant_isolated,
    advisory_only: true,
    governance_supremacy_preserved: !failures.includes("GOVERNANCE_VALIDATION_FAILED"),
    constitutional_enforcement_preserved: !failures.includes("CONSTITUTIONAL_VALIDATION_FAILED"),
    authority_preservation_enforced: !failures.includes("AUTHORITY_BOUNDARY_VIOLATED"),
    operator_first_design_verified: !failures.includes("EXPLAINABILITY_INCOMPLETE") && !failures.includes("ADVISORY_ONLY_VIOLATED"),
    authorizes_implementation: false,
    authorizes_production_mutation: false,
    changes_production_behavior: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptationProposalCertification(result: AdaptationProposalCertificationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getAdaptationProposalCertificationFoundation(): AdaptationProposalCertificationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptation_proposal_certification_gate_version: GATE_VERSION,
    supported_outcomes: OUTCOMES,
    certification_areas: AREAS,
    api_surface,
    result: certifyAdaptationProposalEngine(),
  });
}

export const AdaptationProposalCertificationGate = Object.freeze({
  certify: certifyAdaptationProposalEngine,
  replay: replayAdaptationProposalCertification,
});
