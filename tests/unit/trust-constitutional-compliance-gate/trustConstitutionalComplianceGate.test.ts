import { describe, expect, it } from "vitest";

import { getConstitutionalComplianceGateBundle, replayConstitutionalComplianceGate, runConstitutionalComplianceGate, validateConstitutionalComplianceGate } from "@/services/trust-constitutional-compliance-gate";
import type { ConstitutionalComplianceGateFailure } from "@/types/trust-constitutional-compliance-gate";

const failClosedFailures = ["STAGE_1_TRUST_FOUNDATION_INVALID", "TRUST_CONSTITUTION_INVALID", "TRUST_ARCHITECTURE_INVALID", "TRUST_DOCTRINE_INVALID", "TRUST_VOCABULARY_INVALID", "TRUST_REGISTRY_CONTRACTS_INVALID", "TRUST_EVENT_MODEL_INVALID", "CCI_IDENTITY_INVALID", "CCI_GOVERNANCE_INVALID", "CCI_EVIDENCE_SERVICES_INVALID", "CAF_AUTHORITY_MODEL_INVALID", "CONSTITUTIONAL_RULE_ENGINE_MISSING", "RULE_REGISTRY_MISSING", "RULE_ORDERING_NON_DETERMINISTIC", "RULE_VERSION_MUTABLE", "RULE_DEPENDENCIES_INVALID", "CONSTITUTION_PROFILES_MISSING", "ADMISSIBILITY_ENGINE_MISSING", "REQUEST_NOT_EVALUATED", "AUTHORITY_VERIFICATION_MISSING", "IDENTITY_VERIFICATION_MISSING", "JURISDICTION_VALIDATION_MISSING", "TENANT_BOUNDARY_VALIDATION_MISSING", "MISSION_CONTEXT_VALIDATION_MISSING", "CONSTITUTION_VERSION_UNRESOLVED", "VIOLATION_ENGINE_MISSING", "VIOLATION_REGISTRY_MISSING", "VIOLATION_CLASSIFICATION_MISSING", "VIOLATION_EVIDENCE_MISSING", "VIOLATION_LINEAGE_MISSING", "FAIL_CLOSED_ENGINE_MISSING", "FAIL_OPEN_PATH_DETECTED", "UNKNOWN_AUTHORITY_ALLOWED", "UNKNOWN_IDENTITY_ALLOWED", "UNKNOWN_CONSTITUTION_ALLOWED", "MISSING_EVIDENCE_ALLOWED", "DEPENDENCY_FAILURE_ALLOWED", "PROCESSING_EXCEPTION_ALLOWED", "TIMEOUT_ALLOWED", "CONSTITUTIONAL_EVIDENCE_MISSING", "EVIDENCE_PACKAGE_INCOMPLETE", "EVIDENCE_HASH_INVALID", "EVIDENCE_SIGNATURE_INVALID", "EVIDENCE_LINEAGE_INCOMPLETE", "EVIDENCE_TAMPER_DETECTION_MISSING", "CONSTITUTIONAL_REPLAY_MISSING", "REPLAY_NON_DETERMINISTIC", "REPLAY_OUTPUT_MISMATCH", "REPLAY_EVIDENCE_MISMATCH", "REPLAY_AUDIT_MISSING", "DOWNSTREAM_EXECUTED_BEFORE_ADMISSION", "TRUST_EVALUATION_BYPASSED_GATE"] as const satisfies readonly ConstitutionalComplianceGateFailure[];

describe("Stage 2 Constitutional Compliance Gate", () => {
  it("publishes the mandatory constitutional admission doctrine", () => {
    const bundle = getConstitutionalComplianceGateBundle();

    expect(bundle.doctrine).toMatchObject({ version: "trust-constitutional-compliance-gate/stage-2", mandatory_admission_gate: true, precedes_all_trust_processing: true, deterministic_rule_execution: true, fail_closed_by_default: true, immutable_evidence_required: true, replay_required: true, qualification_gate: "Stage 2 Constitutional Compliance Gate Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("ADMISSIBLE");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes Stage 1 before enabling later trust stages", () => {
    const first = runConstitutionalComplianceGate({ seed: "deterministic" });
    const second = runConstitutionalComplianceGate({ seed: "deterministic" });

    expect(first.upstream_refs).toContain("trust-foundation-stage-one/stage-1");
    expect(first.enables).toEqual(["stage-3:trust-registry", "stage-4:trust-domains", "stage-5:trust-evaluation-engine", "stage-6:confidence-engine", "stage-7:risk-engine", "stage-8:alignment-verification"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateConstitutionalComplianceGate(first).valid).toBe(true);
    expect(replayConstitutionalComplianceGate()).toBe(true);
  });

  it("executes constitutional rules deterministically with immutable versions", () => {
    const result = runConstitutionalComplianceGate();

    expect(result.rules).toMatchObject({ constitution_registry: true, rule_definitions: true, rule_evaluation_engine: true, rule_ordering: true, rule_priorities: true, rule_dependencies: true, rule_versioning: true, constitution_profiles: true, evaluation_context: true, deterministic_execution: true, version_aware: true, replay_compatible: true });
  });

  it("admits only constitutionally valid trust requests", () => {
    const result = runConstitutionalComplianceGate();

    expect(result.admissibility.outcome).toBe("ADMISSIBLE");
    expect(result.admissibility).toMatchObject({ admission_rules: true, admission_context: true, authority_verification: true, identity_verification: true, jurisdiction_validation: true, tenant_boundary_validation: true, mission_context_validation: true, constitution_version_resolution: true, evidence_backed: true, replay_compatible: true });
    expect(result.decision_record).toMatchObject({ evaluated_before_trust_processing: true, downstream_authorized: true });
  });

  it("classifies and immutably records constitutional violations", () => {
    const result = runConstitutionalComplianceGate();

    expect(result.violations.categories).toEqual(["AUTHORITY", "POLICY", "JURISDICTION", "IDENTITY", "SAFETY", "TRUST_BOUNDARY", "EVIDENCE", "GOVERNANCE"]);
    expect(result.violations).toMatchObject({ violation_detection: true, violation_severity: true, violation_registry: true, violation_evidence: true, violation_correlation: true, violation_reporting: true, violation_lineage: true, immutable_recording: true, replay_compatible: true });
  });

  it("guarantees fail-closed processing under uncertainty", () => {
    const result = runConstitutionalComplianceGate();

    expect(result.fail_closed).toMatchObject({ failure_detection: true, missing_evidence_detection: true, invalid_authority_detection: true, unknown_rule_handling: true, processing_timeouts: true, rule_exceptions: true, dependency_failures: true, safe_default_decisions: true, automatic_denial: true, no_fail_open_paths: true, deterministic_handling: true, replay_compatible: true });
    expect(runConstitutionalComplianceGate({ scenario: "UNKNOWN_AUTHORITY_ALLOWED" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runConstitutionalComplianceGate({ scenario: "MISSING_EVIDENCE_ALLOWED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("packages immutable constitutional evidence", () => {
    const result = runConstitutionalComplianceGate();

    expect(result.evidence).toMatchObject({ input_request: true, applicable_constitution: true, rule_versions: true, evaluation_context: true, rule_results: true, violations: true, admission_decision: true, failure_information: true, timestamps: true, cryptographic_hashes: true, signed: true, immutable_storage: true, tamper_detection: true, lineage_complete: true });
  });

  it("replays constitutional decisions with identical inputs, rules, evidence, outputs, and violations", () => {
    const result = runConstitutionalComplianceGate();

    expect(result.replay).toMatchObject({ replay_requests: true, replay_context: true, rule_replay: true, version_resolution: true, evidence_replay: true, decision_comparison: true, replay_validation: true, replay_reporting: true, identical_inputs: true, identical_rules: true, identical_versions: true, identical_evidence: true, identical_outputs: true, identical_violations: true });
  });

  it("enforces the gate before downstream trust processing", () => {
    const result = runConstitutionalComplianceGate();

    expect(result.readiness).toMatchObject({ mandatory_gate_enforced: true, downstream_blocked_until_admission: true, no_fail_open_paths: true, qualification_ready: true });
    expect(runConstitutionalComplianceGate({ scenario: "DOWNSTREAM_EXECUTED_BEFORE_ADMISSION" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runConstitutionalComplianceGate({ scenario: "TRUST_EVALUATION_BYPASSED_GATE" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runConstitutionalComplianceGate({ scenario: failure });
    const validation = validateConstitutionalComplianceGate(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.decision_record.downstream_authorized).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and qualification denial", () => {
    const observed = runConstitutionalComplianceGate({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runConstitutionalComplianceGate({ scenario: "CONDITIONAL_FOLLOWUP" });
    const denied = runConstitutionalComplianceGate({ scenario: "CONSTITUTIONAL_COMPLIANCE_GATE_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("FAIL_CLOSED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("FAIL_CLOSED");
    expect(followup.readiness.failures).toEqual([]);
    expect(denied.readiness.decision).toBe("NOT_ADMISSIBLE");
    expect(denied.decision_record.downstream_authorized).toBe(false);
    expect(validateConstitutionalComplianceGate(denied).valid).toBe(false);
  });
});
