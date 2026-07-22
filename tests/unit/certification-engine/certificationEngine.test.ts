import { describe, expect, it } from "vitest";

import {
  getCertificationEngineBundle,
  replayCertificationEngine,
  runCertificationEngine,
  validateCertificationEngine,
} from "@/services/certification-engine";
import type { CertificationEngineFailure } from "@/types/certification-engine";

const conditionalFailures: CertificationEngineFailure[] = [
  "CERTIFICATION_SERVICE_MISSING",
  "CERTIFICATION_APPROVAL_MISSING",
  "AGENT_CERTIFICATION_MISSING",
  "CAPABILITY_CERTIFICATION_MISSING",
  "SKILL_CERTIFICATION_MISSING",
  "RUNTIME_CERTIFICATION_MISSING",
  "QUALIFICATION_ENGINE_MISSING",
  "QUALIFICATION_SCORE_MISSING",
  "CERTIFICATION_REGISTRY_MISSING",
  "CERTIFICATION_LIFECYCLE_MISSING",
  "RECERTIFICATION_MISSING",
  "CERTIFICATION_EVIDENCE_MISSING",
  "CERTIFICATION_GOVERNANCE_MISSING",
  "CERTIFICATION_API_MISSING",
  "CERTIFICATION_VIEW_MISSING",
  "QUALIFICATION_REPORT_MISSING",
];

const failClosedFailures: CertificationEngineFailure[] = [
  "W2_1_AGENT_REGISTRY_INVALID",
  "W2_3_CAPABILITY_REGISTRY_INVALID",
  "W2_4_SKILL_REGISTRY_INVALID",
  "W2_5_AUTHORITY_VALIDATOR_INVALID",
  "W2_6_POLICY_GATE_INVALID",
  "W2_7_SAFETY_GATE_INVALID",
  "W2_8_PLANNING_ENGINE_INVALID",
  "W2_9_MEMORY_ENGINE_INVALID",
  "W2_10_RUNTIME_ORCHESTRATOR_INVALID",
  "W2_11_DELEGATION_ENGINE_INVALID",
  "W2_12_COLLABORATION_ENGINE_INVALID",
  "W2_13_EVIDENCE_ENGINE_INVALID",
  "W2_14_REPLAY_ENGINE_INVALID",
  "CERTIFICATION_WORKFLOW_NON_DETERMINISTIC",
  "CERTIFICATE_NOT_SIGNED",
  "AGENT_IDENTITY_VALIDATION_FAILED",
  "AGENT_EVIDENCE_INCOMPLETE",
  "CAPABILITY_DEPENDENCY_INVALID",
  "CAPABILITY_REPLAY_INVALID",
  "SKILL_CONTRACT_INVALID",
  "SKILL_VERSION_INCOMPATIBLE",
  "SKILL_DETERMINISM_FAILED",
  "RUNTIME_CONFIGURATION_INVALID",
  "RUNTIME_SECURITY_FAILED",
  "RUNTIME_OBSERVABILITY_MISSING",
  "QUALIFICATION_DECISION_NON_DETERMINISTIC",
  "OPERATIONAL_READINESS_FAILED",
  "CERTIFICATION_LINEAGE_MUTABLE",
  "CERTIFICATION_VERSIONING_MISSING",
  "REVOCATION_NOT_ENFORCED",
  "EXPIRATION_NOT_ENFORCED",
  "EVIDENCE_PACKAGE_NOT_LINKED",
  "REPLAY_REPORT_NOT_LINKED",
  "SEPARATION_OF_DUTIES_FAILED",
  "AUDIT_RECORDING_MISSING",
  "CERTIFICATION_REPLAY_INVALID",
];

describe("W2.15 certification engine", () => {
  it("publishes the constitutional certification doctrine and qualification gate", () => {
    const bundle = getCertificationEngineBundle();

    expect(bundle.doctrine.version).toBe("certification-engine/w2.15");
    expect(bundle.doctrine.owns_agent_certification).toBe(true);
    expect(bundle.doctrine.owns_capability_certification).toBe(true);
    expect(bundle.doctrine.owns_skill_certification).toBe(true);
    expect(bundle.doctrine.owns_runtime_certification).toBe(true);
    expect(bundle.doctrine.owns_qualification_framework).toBe(true);
    expect(bundle.doctrine.owns_certification_governance).toBe(true);
    expect(bundle.doctrine.owns_certification_evidence).toBe(true);
    expect(bundle.doctrine.owns_certification_lineage).toBe(true);
    expect(bundle.doctrine.owns_certification_lifecycle).toBe(true);
    expect(bundle.doctrine.qualification_gate).toBe("Certification Engine Qualification Gate");
    expect(bundle.result.readiness.decision).toBe("CERTIFICATION_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic across upstream certification dependencies and replay", () => {
    const first = runCertificationEngine({ seed: "deterministic" });
    const second = runCertificationEngine({ seed: "deterministic" });

    expect(first.upstream_refs).toHaveLength(13);
    expect(first.upstream_refs[0]).toBe("agent-registry/w2.1");
    expect(first.upstream_refs.at(-1)).toBe("replay-engine/w2.14");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateCertificationEngine(first).valid).toBe(true);
    expect(replayCertificationEngine()).toBe(true);
  });

  it("certifies agents, capabilities, skills, and runtime execution", () => {
    const result = runCertificationEngine();

    expect(result.service.signed_certificates).toBe(true);
    expect(result.service.deterministic_workflows).toBe(true);
    expect(result.service.evidence_verification).toBe(true);
    expect(result.service.replay_verification).toBe(true);
    expect(result.service.approval_workflow).toBe(true);
    expect(result.agent_certification.identity).toBe(true);
    expect(result.agent_certification.evidence_completeness).toBe(true);
    expect(result.agent_certification.replay_determinism).toBe(true);
    expect(result.capability_certification.dependency_validation).toBe(true);
    expect(result.capability_certification.replay_verification).toBe(true);
    expect(result.capability_certification.evidence_validation).toBe(true);
    expect(result.skill_certification.interface_contracts).toBe(true);
    expect(result.skill_certification.version_compatibility).toBe(true);
    expect(result.skill_certification.deterministic_execution).toBe(true);
    expect(result.runtime_certification.orchestration).toBe(true);
    expect(result.runtime_certification.security).toBe(true);
    expect(result.runtime_certification.observability).toBe(true);
  });

  it("maintains qualification, registry, and lifecycle authority", () => {
    const result = runCertificationEngine();

    expect(result.qualification.qualification_decision).toBe("CERTIFICATION_QUALIFIED");
    expect(result.qualification.qualification_score).toBe(100);
    expect(result.qualification.deterministic_decisions).toBe(true);
    expect(result.qualification.constitutional_compliance).toBe(true);
    expect(result.qualification.operational_readiness).toBe(true);
    expect(result.registry.immutable_history).toBe(true);
    expect(result.registry.versioning).toBe(true);
    expect(result.registry.audit).toBe(true);
    expect(result.lifecycle.states).toEqual([
      "Draft",
      "Pending Review",
      "Under Qualification",
      "Qualified",
      "Certified",
      "Conditionally Certified",
      "Suspended",
      "Revoked",
      "Expired",
      "Retired",
    ]);
    expect(result.lifecycle.recertification).toBe(true);
    expect(result.lifecycle.renewal).toBe(true);
    expect(result.lifecycle.suspension).toBe(true);
    expect(result.lifecycle.revocation).toBe(true);
    expect(result.lifecycle.expiration).toBe(true);
  });

  it("links evidence, governance, APIs, views, and reports", () => {
    const result = runCertificationEngine();

    expect(result.evidence_integration.evidence_packages).toBe(true);
    expect(result.evidence_integration.replay_reports).toBe(true);
    expect(result.evidence_integration.immutable_links).toBe(true);
    expect(result.governance.separation_of_duties).toBe(true);
    expect(result.governance.operator_review).toBe(true);
    expect(result.governance.audit_recording).toBe(true);
    expect(result.governance.authority_controls).toBe(true);
    expect(result.governance.policy_controls).toBe(true);
    expect(result.governance.safety_controls).toBe(true);
    expect(result.apis.submit_certification).toBe(true);
    expect(result.apis.run_qualification).toBe(true);
    expect(result.apis.retrieve_replay_references).toBe(true);
    expect(result.apis.stable).toBe(true);
    expect(result.view.dashboard).toBe(true);
    expect(result.view.certificate_lineage).toBe(true);
    expect(result.reports.automatic_generation).toBe(true);
    expect(result.reports.replay_verification).toBe(true);
    expect(result.reports.operational_readiness).toBe(true);
  });

  it("degrades to conditional qualification for recoverable certification gaps", () => {
    for (const failure of conditionalFailures) {
      const result = runCertificationEngine({ scenario: failure });

      expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
      expect(result.readiness.failures).toContain(failure);
      expect(result.readiness.phase_ready).toBe(false);
      expect(validateCertificationEngine(result).valid).toBe(false);
    }
  });

  it("fails closed for dependency, integrity, and enforcement failures", () => {
    for (const failure of failClosedFailures) {
      const result = runCertificationEngine({ scenario: failure });

      expect(result.readiness.decision).toBe("FAIL_CLOSED");
      expect(result.readiness.failures).toContain(failure);
      expect(result.readiness.phase_ready).toBe(false);
      expect(validateCertificationEngine(result).valid).toBe(false);
    }
  });

  it("distinguishes observation, conditional follow-up, and failed qualification outcomes", () => {
    const observed = runCertificationEngine({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followUp = runCertificationEngine({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runCertificationEngine({ scenario: "CERTIFICATION_ENGINE_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followUp.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.qualification_ready).toBe(true);
    expect(validateCertificationEngine(notQualified).valid).toBe(false);
  });
});
