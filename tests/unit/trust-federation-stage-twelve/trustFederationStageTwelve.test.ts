import { describe, expect, it } from "vitest";

import { getTrustFederationStageTwelveBundle, replayTrustFederationStageTwelve, runTrustFederationStageTwelve, validateTrustFederationStageTwelve } from "@/services/trust-federation-stage-twelve";
import type { TrustFederationFailure } from "@/types/trust-federation-stage-twelve";

const conditionalFailures = ["FEDERATION_CONTRACT_MODEL_MISSING", "TRUST_EXCHANGE_CONTRACTS_MISSING", "FEDERATION_PROTOCOLS_MISSING", "TRUST_ASSERTION_CONTRACTS_MISSING", "EVIDENCE_EXCHANGE_CONTRACTS_MISSING", "CONTRACT_VERSIONING_MISSING", "COMPATIBILITY_RULES_MISSING", "CAPABILITY_NEGOTIATION_MISSING", "CONTRACT_VALIDATION_MISSING", "CONTRACT_GOVERNANCE_MISSING", "REMOTE_TRUST_VERIFICATION_MISSING", "TRUST_ASSERTION_VALIDATION_MISSING", "IDENTITY_VERIFICATION_MISSING", "EVIDENCE_VERIFICATION_MISSING", "SIGNATURE_VALIDATION_MISSING", "CERTIFICATE_VALIDATION_MISSING", "STANDING_VERIFICATION_MISSING", "RESTRICTION_VERIFICATION_MISSING", "TRUST_FRESHNESS_VALIDATION_MISSING", "VERIFICATION_REPLAY_MISSING", "FEDERATION_EVIDENCE_CAPTURE_MISSING", "TRUST_EXCHANGE_EVIDENCE_MISSING", "VERIFICATION_EVIDENCE_MISSING", "CONTRACT_EVIDENCE_MISSING", "BOUNDARY_EVIDENCE_MISSING", "FEDERATION_AUDIT_RECORDS_MISSING", "REPLAY_EVIDENCE_MISSING", "SIGNATURE_EVIDENCE_MISSING", "EVIDENCE_PACKAGING_MISSING", "EVIDENCE_LINEAGE_MISSING", "FEDERATION_AUTHORIZATION_POLICIES_MISSING", "ALLOWED_RELATIONSHIPS_MISSING", "RESTRICTED_RELATIONSHIPS_MISSING", "TRUST_IMPORT_POLICIES_MISSING", "TRUST_EXPORT_POLICIES_MISSING", "POLICY_VERSIONING_MISSING", "FEDERATION_APPROVAL_RULES_MISSING", "FEDERATION_REVOCATION_POLICIES_MISSING", "FEDERATION_GOVERNANCE_RULES_MISSING", "POLICY_VALIDATION_MISSING", "TENANT_BOUNDARY_ENFORCEMENT_MISSING", "DOMAIN_ISOLATION_MISSING", "ORGANIZATIONAL_ISOLATION_MISSING", "TRUST_BOUNDARY_VALIDATION_MISSING", "UNAUTHORIZED_ACCESS_PREVENTION_MISSING", "FEDERATION_RESTRICTIONS_MISSING", "DATA_ISOLATION_MISSING", "CROSS_BOUNDARY_VALIDATION_MISSING", "FAIL_CLOSED_ENFORCEMENT_MISSING", "BOUNDARY_AUDITING_MISSING", "FEDERATION_HEALTH_MONITORING_MISSING", "CONTRACT_MONITORING_MISSING", "VERIFICATION_MONITORING_MISSING", "FEDERATION_PERFORMANCE_MISSING", "FEDERATION_ERRORS_MISSING", "FEDERATION_DRIFT_DETECTION_MISSING", "CONTRACT_EXPIRATION_MONITORING_MISSING", "POLICY_COMPLIANCE_MONITORING_MISSING", "FEDERATION_ALERTS_MISSING", "FEDERATION_METRICS_MISSING"] as const satisfies readonly TrustFederationFailure[];
const failClosedFailures = ["STAGE_1_TRUST_FOUNDATION_INVALID", "STAGE_2_CONSTITUTIONAL_GATE_INVALID", "STAGE_3_TRUST_REGISTRY_DOMAINS_INVALID", "STAGE_4_INDEPENDENT_EVALUATION_INVALID", "STAGE_5_TRUST_RESOLUTION_INVALID", "STAGE_6_EXPLAINABILITY_INVALID", "STAGE_7_HUMAN_OVERSIGHT_INVALID", "STAGE_8_CONTINUOUS_MONITORING_INVALID", "STAGE_9_DRIFT_DETECTION_INVALID", "STAGE_10_RECOVERY_REVOCATION_INVALID", "STAGE_11_TRUST_CERTIFICATION_INVALID", "FEDERATION_BYPASSED_CONSTITUTIONAL_EVALUATION", "REMOTE_ASSERTION_TREATED_AS_DECISION", "TENANT_ISOLATION_COMPROMISED", "UNAUTHORIZED_TRUST_PROPAGATION", "TENANT_DATA_LEAKAGE", "POLICY_BYPASS", "AUTHORITY_INHERITANCE_ALLOWED", "STANDING_INHERITANCE_ALLOWED", "FEDERATION_EVIDENCE_MUTABLE", "FEDERATION_REPLAY_DIVERGED"] as const satisfies readonly TrustFederationFailure[];

describe("Stage 12 Trust Federation", () => {
  it("publishes the constitutional trust federation doctrine", () => {
    const bundle = getTrustFederationStageTwelveBundle();

    expect(bundle.doctrine).toMatchObject({ version: "trust-federation-stage-twelve/stage-12", constitutional_supremacy: true, tenant_sovereignty_required: true, remote_assertions_are_evidence_not_decisions: true, least_trust_required: true, tenant_isolation_required: true, deterministic_replay_required: true, qualification_gate: "Stage 12 Trust Federation Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("TRUST_FEDERATION_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes stages 1 through 11", () => {
    const first = runTrustFederationStageTwelve({ seed: "deterministic" });
    const second = runTrustFederationStageTwelve({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["trust-foundation-stage-one/stage-1", "trust-constitutional-compliance-gate/stage-2", "trust-registry-domains/stage-3", "trust-independent-evaluation/stage-4", "trust-resolution-engine/stage-5", "trust-explainability-stage-six/stage-6", "trust-human-oversight-stage-seven/stage-7", "trust-continuous-monitoring-stage-eight/stage-8", "trust-drift-detection-stage-nine/stage-9", "trust-recovery-revocation-stage-ten/stage-10", "trust-certification-stage-eleven/stage-11"]);
    expect(first.provides).toEqual(["trust-federation-service", "cross-tenant-verification-engine", "federation-policy-engine", "boundary-enforcement-engine", "federation-monitoring-service", "federation-evidence-service", "federation-registry"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustFederationStageTwelve(first).valid).toBe(true);
    expect(replayTrustFederationStageTwelve()).toBe(true);
  });

  it("governs federation contracts and cross-tenant verification", () => {
    const result = runTrustFederationStageTwelve();

    expect(result.contracts).toMatchObject({ federation_contract_model: true, trust_exchange_contracts: true, federation_protocol_definitions: true, trust_assertion_contracts: true, evidence_exchange_contracts: true, contract_versioning: true, compatibility_rules: true, capability_negotiation: true, contract_validation: true, contract_governance: true });
    expect(result.verification).toMatchObject({ remote_trust_verification: true, trust_assertion_validation: true, identity_verification: true, evidence_verification: true, signature_validation: true, certificate_validation: true, standing_verification: true, restriction_verification: true, trust_freshness_validation: true, replay_validation: true, remote_assertions_are_evidence_only: true, local_evaluation_required: true });
    expect(runTrustFederationStageTwelve({ scenario: "REMOTE_ASSERTION_TREATED_AS_DECISION" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("captures immutable evidence and enforces federation policy", () => {
    const result = runTrustFederationStageTwelve();

    expect(result.evidence).toMatchObject({ federation_evidence_capture: true, trust_exchange_evidence: true, verification_evidence: true, contract_evidence: true, boundary_evidence: true, federation_audit_records: true, replay_evidence: true, signature_evidence: true, evidence_packaging: true, evidence_lineage: true, immutable: true });
    expect(result.policies).toMatchObject({ federation_authorization_policies: true, allowed_relationships: true, restricted_relationships: true, trust_import_policies: true, trust_export_policies: true, policy_versioning: true, federation_approval_rules: true, federation_revocation_policies: true, federation_governance_rules: true, policy_validation: true, governs_every_exchange: true });
    expect(runTrustFederationStageTwelve({ scenario: "POLICY_BYPASS" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustFederationStageTwelve({ scenario: "FEDERATION_EVIDENCE_MUTABLE" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("preserves tenant boundaries and monitors federation health", () => {
    const result = runTrustFederationStageTwelve();

    expect(result.boundary).toMatchObject({ tenant_boundary_enforcement: true, domain_isolation: true, organizational_isolation: true, trust_boundary_validation: true, unauthorized_access_prevention: true, federation_restrictions: true, data_isolation: true, cross_boundary_validation: true, fail_closed_enforcement: true, boundary_auditing: true, tenant_sovereignty_preserved: true });
    expect(result.monitoring).toMatchObject({ federation_health_monitoring: true, contract_monitoring: true, verification_monitoring: true, federation_performance: true, federation_errors: true, trust_drift_detection: true, contract_expiration_monitoring: true, policy_compliance_monitoring: true, federation_alerts: true, federation_metrics: true, deterministic_alerts: true });
    expect(runTrustFederationStageTwelve({ scenario: "TENANT_ISOLATION_COMPROMISED" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustFederationStageTwelve({ scenario: "TENANT_DATA_LEAKAGE" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("records federation registry shape and forbids inherited authority or standing", () => {
    const result = runTrustFederationStageTwelve();

    expect(result.registry.relationship_types).toEqual(["TENANT", "ORGANIZATION", "ECOSYSTEM"]);
    expect(result.registry.exchange_types).toEqual(["TRUST_ASSERTION", "EVIDENCE_PACKAGE", "CERTIFICATION_RECORD", "REVOCATION_NOTICE", "MONITORING_SIGNAL"]);
    expect(result.registry).toMatchObject({ federation_registry: true, federation_contract_registry: true, federation_policy_registry: true, verification_registry: true, federation_evidence_registry: true, searchable: true, replayable: true, lineage_aware: true });
    expect(result.readiness).toMatchObject({ constitutional_supremacy: true, tenant_sovereignty: true, independent_evaluation: true, least_trust: true, boundary_preservation: true, deterministic_federation: true, immutable_evidence: true, fail_closed: true, certification_ready: true });
    expect(runTrustFederationStageTwelve({ scenario: "AUTHORITY_INHERITANCE_ALLOWED" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustFederationStageTwelve({ scenario: "STANDING_INHERITANCE_ALLOWED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runTrustFederationStageTwelve({ scenario: failure });
    const validation = validateTrustFederationStageTwelve(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runTrustFederationStageTwelve({ scenario: failure });
    const validation = validateTrustFederationStageTwelve(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runTrustFederationStageTwelve({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runTrustFederationStageTwelve({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runTrustFederationStageTwelve({ scenario: "TRUST_FEDERATION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateTrustFederationStageTwelve(notQualified).valid).toBe(false);
  });
});
