import { describe, expect, it } from "vitest";

import { getTrustCertificationStageElevenBundle, replayTrustCertificationStageEleven, runTrustCertificationStageEleven, validateTrustCertificationStageEleven } from "@/services/trust-certification-stage-eleven";
import type { TrustCertificationFailure } from "@/types/trust-certification-stage-eleven";

const conditionalFailures = ["QUALIFICATION_MODEL_MISSING", "QUALIFICATION_LIFECYCLE_MISSING", "QUALIFICATION_STATUS_MODEL_MISSING", "QUALIFICATION_CRITERIA_MISSING", "QUALIFICATION_DOMAINS_MISSING", "QUALIFICATION_POLICIES_MISSING", "QUALIFICATION_SCOPE_MISSING", "QUALIFICATION_DEPENDENCIES_MISSING", "CERTIFICATION_RULE_ENGINE_MISSING", "QUALIFICATION_RULE_EVALUATION_MISSING", "EVIDENCE_SUFFICIENCY_EVALUATION_MISSING", "CONSTITUTIONAL_VALIDATION_MISSING", "TRUST_STANDING_VERIFICATION_MISSING", "RESTRICTION_VALIDATION_MISSING", "MONITORING_VALIDATION_MISSING", "DRIFT_VALIDATION_MISSING", "HUMAN_OVERSIGHT_VALIDATION_MISSING", "RECOVERY_VALIDATION_MISSING", "QUALIFICATION_RULE_LIBRARY_MISSING", "RULE_REGISTRY_MISSING", "RULE_VALIDATION_SUITE_MISSING", "RULE_VERSIONING_MISSING", "RULE_IMMUTABILITY_MISSING", "RULE_REPLAY_MISSING", "RULE_EVIDENCE_MISSING", "CERTIFICATION_EVIDENCE_SERVICE_MISSING", "CONSTITUTIONAL_EVIDENCE_MISSING", "TRUST_EVALUATION_EVIDENCE_MISSING", "CONFIDENCE_EVIDENCE_MISSING", "RISK_EVIDENCE_MISSING", "ALIGNMENT_EVIDENCE_MISSING", "EXPLAINABILITY_EVIDENCE_MISSING", "HUMAN_OVERSIGHT_EVIDENCE_MISSING", "MONITORING_EVIDENCE_MISSING", "DRIFT_EVIDENCE_MISSING", "RECOVERY_EVIDENCE_MISSING", "REPLAY_EVIDENCE_MISSING", "CERTIFICATION_REPORT_GENERATOR_MISSING", "TRUST_QUALIFICATION_REPORT_MISSING", "CERTIFICATION_SUMMARY_MISSING", "QUALIFICATION_FINDINGS_MISSING", "CONSTITUTIONAL_COMPLIANCE_REPORT_MISSING", "RULE_EVALUATION_REPORT_MISSING", "EVIDENCE_SUMMARY_MISSING", "REPLAY_VALIDATION_REPORT_MISSING", "CERTIFICATION_HISTORY_MISSING", "QUALIFICATION_TREND_REPORT_MISSING", "CERTIFICATION_REGISTRY_MISSING", "QUALIFICATION_REGISTRY_MISSING", "CERTIFICATION_VERSIONING_MISSING", "CERTIFICATION_STATUS_MISSING", "EVIDENCE_REFERENCES_MISSING", "CERTIFICATION_METADATA_MISSING", "REGISTRY_REPLAY_MISSING", "REGISTRY_LINEAGE_MISSING", "CERTIFICATION_LIFECYCLE_ENGINE_MISSING", "LIFECYCLE_HISTORY_MISSING", "LIFECYCLE_APIS_MISSING", "RENEWAL_MISSING", "SUSPENSION_MISSING", "REVOCATION_MISSING", "EXPIRATION_MISSING", "RECERTIFICATION_MISSING", "HISTORICAL_REPLAY_MISSING", "CERTIFICATION_EXPLAINABILITY_MISSING", "QUALIFICATION_NARRATIVE_MISSING", "RULE_TRACEABILITY_MISSING", "CONSTITUTIONAL_REASONING_MISSING", "EVIDENCE_MAPPING_MISSING", "DECISION_LINEAGE_MISSING", "RULE_DEPENDENCIES_MISSING", "FAILURE_EXPLANATION_MISSING", "CERTIFICATION_REPLAY_ENGINE_MISSING", "RULE_REPLAY_ENGINE_MISSING", "EVIDENCE_REPLAY_MISSING", "EVALUATION_REPLAY_MISSING", "DECISION_REPLAY_MISSING", "QUALIFICATION_REPLAY_MISSING", "REPORT_REPLAY_MISSING", "CERTIFICATION_API_MISSING", "REGISTRY_API_MISSING", "REPLAY_API_MISSING", "REPORT_API_MISSING", "VERIFY_CERTIFICATION_API_MISSING", "SEARCH_CERTIFICATIONS_API_MISSING"] as const satisfies readonly TrustCertificationFailure[];
const failClosedFailures = ["STAGE_1_TRUST_FOUNDATION_INVALID", "STAGE_2_CONSTITUTIONAL_GATE_INVALID", "STAGE_3_TRUST_REGISTRY_DOMAINS_INVALID", "STAGE_4_INDEPENDENT_EVALUATION_INVALID", "STAGE_5_TRUST_RESOLUTION_INVALID", "STAGE_6_EXPLAINABILITY_INVALID", "STAGE_7_HUMAN_OVERSIGHT_INVALID", "STAGE_8_CONTINUOUS_MONITORING_INVALID", "STAGE_9_DRIFT_DETECTION_INVALID", "STAGE_10_RECOVERY_REVOCATION_INVALID", "CERTIFICATION_BYPASSED_CONSTITUTIONAL_EVALUATION", "CERTIFICATION_OVERRIDES_TRUST_DECISION", "CERTIFICATION_MODIFIED_HISTORICAL_EVIDENCE", "CERTIFICATION_USED_INFERRED_EVIDENCE", "CERTIFICATION_LINEAGE_MUTABLE", "CERTIFICATION_REPORT_NOT_VERIFIABLE", "CERTIFICATION_REPLAY_DIVERGED"] as const satisfies readonly TrustCertificationFailure[];

describe("Stage 11 Trust Certification", () => {
  it("publishes the constitutional trust certification doctrine", () => {
    const bundle = getTrustCertificationStageElevenBundle();

    expect(bundle.doctrine).toMatchObject({ version: "trust-certification-stage-eleven/stage-11", constitutional_certification_authority: true, evidence_driven_only: true, never_overrides_trust_decisions: true, never_modifies_historical_evidence: true, deterministic_replay_required: true, cryptographic_verification_required: true, qualification_gate: "Stage 11 Trust Certification Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("TRUST_CERTIFICATION_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes stages 1 through 10", () => {
    const first = runTrustCertificationStageEleven({ seed: "deterministic" });
    const second = runTrustCertificationStageEleven({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["trust-foundation-stage-one/stage-1", "trust-constitutional-compliance-gate/stage-2", "trust-registry-domains/stage-3", "trust-independent-evaluation/stage-4", "trust-resolution-engine/stage-5", "trust-explainability-stage-six/stage-6", "trust-human-oversight-stage-seven/stage-7", "trust-continuous-monitoring-stage-eight/stage-8", "trust-drift-detection-stage-nine/stage-9", "trust-recovery-revocation-stage-ten/stage-10"]);
    expect(first.provides).toEqual(["trust-certification-service", "certification-evaluation-engine", "qualification-rule-engine", "certification-evidence-service", "certification-report-generator", "certification-replay-engine", "certification-explainability-service", "certification-registry", "qualification-registry"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustCertificationStageEleven(first).valid).toBe(true);
    expect(replayTrustCertificationStageEleven()).toBe(true);
  });

  it("establishes qualification framework, evaluation, and immutable rules", () => {
    const result = runTrustCertificationStageEleven();

    expect(result.framework).toMatchObject({ qualification_model: true, qualification_lifecycle: true, qualification_status_model: true, qualification_criteria: true, qualification_domains: true, qualification_policies: true, qualification_scope: true, qualification_dependencies: true, registry_schema: true });
    expect(result.evaluation).toMatchObject({ certification_rule_engine: true, qualification_rule_evaluation: true, evidence_sufficiency_evaluation: true, constitutional_validation: true, trust_standing_verification: true, restriction_validation: true, monitoring_validation: true, drift_validation: true, human_oversight_validation: true, recovery_validation: true, replay_integrity: true });
    expect(result.rules).toMatchObject({ rule_library: true, rule_registry: true, rule_validation_suite: true, deterministic: true, versioned: true, immutable: true, replayable: true, evidence_backed: true, independently_testable: true });
    expect(runTrustCertificationStageEleven({ scenario: "CERTIFICATION_BYPASSED_CONSTITUTIONAL_EVALUATION" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("builds certification evidence, reports, and registry from immutable sources", () => {
    const result = runTrustCertificationStageEleven();

    expect(result.evidence).toMatchObject({ certification_request: true, qualification_inputs: true, rule_results: true, supporting_evidence: true, evaluation_trace: true, decision_justification: true, certification_outcome: true, replay_references: true, cryptographic_hashes: true, immutable: true, exclusive_immutable_sources: true });
    expect(result.reports).toMatchObject({ trust_qualification_report: true, certification_summary: true, qualification_findings: true, constitutional_compliance_report: true, rule_evaluation_report: true, evidence_summary: true, replay_validation_report: true, certification_history: true, qualification_trend_report: true, digitally_signed: true, reproducible: true });
    expect(result.registry.qualification_scope).toEqual(["TRUST_DOMAIN", "TRUST_SUBJECT", "TRUST_SERVICE", "AUTONOMOUS_AGENT", "TRUST_DECISION"]);
    expect(result.registry).toMatchObject({ certification_records: true, qualification_history: true, certification_versions: true, certification_status: true, evidence_references: true, rule_versions: true, certification_metadata: true, immutable: true, replayable: true, searchable: true, lineage_aware: true });
    expect(runTrustCertificationStageEleven({ scenario: "CERTIFICATION_USED_INFERRED_EVIDENCE" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustCertificationStageEleven({ scenario: "CERTIFICATION_MODIFIED_HISTORICAL_EVIDENCE" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("supports certification lifecycle, explainability, replay, and APIs", () => {
    const result = runTrustCertificationStageEleven();

    expect(result.lifecycle.states).toEqual(["REQUESTED", "EVIDENCE_COLLECTION", "QUALIFICATION_EVALUATION", "RULE_VALIDATION", "CERTIFICATION_REVIEW", "CERTIFIED", "CONDITIONALLY_CERTIFIED", "CERTIFICATION_SUSPENDED", "CERTIFICATION_REVOKED", "CERTIFICATION_EXPIRED", "CERTIFICATION_ARCHIVED"]);
    expect(result.lifecycle).toMatchObject({ initial_certification: true, renewal: true, suspension: true, revocation: true, expiration: true, recertification: true, historical_replay: true, lifecycle_history: true, lifecycle_apis: true });
    expect(result.explainability).toMatchObject({ qualification_narrative: true, rule_traceability: true, constitutional_reasoning: true, evidence_mapping: true, decision_lineage: true, rule_dependencies: true, certification_history: true, failure_explanation: true, complete_justification: true });
    expect(result.replay).toMatchObject({ certification_replay_engine: true, rule_replay: true, evidence_replay: true, evaluation_replay: true, decision_replay: true, qualification_replay: true, registry_replay: true, report_replay: true, identical_evidence: true, identical_rule_execution: true, identical_outcome: true, identical_reports: true, identical_lineage: true });
    expect(result.apis).toMatchObject({ submit_certification_request: true, evaluate_qualification: true, retrieve_certification: true, retrieve_qualification_history: true, retrieve_certification_evidence: true, retrieve_certification_reports: true, verify_certification: true, replay_certification: true, search_certifications: true, retrieve_certification_status: true, sdk_interfaces: true });
  });

  it("preserves certification authority boundaries", () => {
    const result = runTrustCertificationStageEleven();

    expect(result.readiness).toMatchObject({ phase_ready: true, upstream_ready: true, framework_ready: true, evaluation_ready: true, rules_ready: true, evidence_ready: true, reports_ready: true, registry_ready: true, lifecycle_ready: true, explainability_ready: true, replay_ready: true, apis_ready: true, evidence_driven: true, no_bypass: true, no_override: true, historical_evidence_preserved: true, no_inferred_evidence: true, immutable_lineage: true, replayable: true, cryptographically_verifiable: true, certification_authority_ready: true });
    expect(runTrustCertificationStageEleven({ scenario: "CERTIFICATION_OVERRIDES_TRUST_DECISION" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustCertificationStageEleven({ scenario: "CERTIFICATION_LINEAGE_MUTABLE" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustCertificationStageEleven({ scenario: "CERTIFICATION_REPORT_NOT_VERIFIABLE" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustCertificationStageEleven({ scenario: "CERTIFICATION_REPLAY_DIVERGED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runTrustCertificationStageEleven({ scenario: failure });
    const validation = validateTrustCertificationStageEleven(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runTrustCertificationStageEleven({ scenario: failure });
    const validation = validateTrustCertificationStageEleven(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runTrustCertificationStageEleven({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runTrustCertificationStageEleven({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runTrustCertificationStageEleven({ scenario: "TRUST_CERTIFICATION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateTrustCertificationStageEleven(notQualified).valid).toBe(false);
  });
});
