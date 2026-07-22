import { describe, expect, it } from "vitest";

import { getEvidenceEngineBundle, replayEvidenceEngine, runEvidenceEngine, validateEvidenceEngine } from "@/services/evidence-engine";
import type { EvidenceEngineFailure } from "@/types/evidence-engine";

const conditionalFailures = ["EVIDENCE_CAPTURE_MISSING", "EVIDENCE_PACKAGE_MISSING", "EVIDENCE_INDEX_MISSING", "EVIDENCE_VALIDATION_MISSING", "PROVENANCE_MISSING", "EVIDENCE_CONTRACTS_MISSING", "EVIDENCE_EXPLORER_MISSING", "EVIDENCE_RUNTIME_INTEGRATION_MISSING", "EVIDENCE_API_MISSING"] as const satisfies readonly EvidenceEngineFailure[];
const failClosedFailures = ["W2_0_CAF_CONSTITUTION_INVALID", "W2_1_AGENT_REGISTRY_INVALID", "W2_2_LIFECYCLE_ENGINE_INVALID", "W2_3_CAPABILITY_REGISTRY_INVALID", "W2_4_SKILL_REGISTRY_INVALID", "W2_5_AUTHORITY_VALIDATOR_INVALID", "W2_6_POLICY_GATE_INVALID", "W2_7_SAFETY_GATE_INVALID", "W2_8_PLANNING_ENGINE_INVALID", "W2_9_MEMORY_ENGINE_INVALID", "W2_10_RUNTIME_ORCHESTRATOR_INVALID", "W2_11_DELEGATION_ENGINE_INVALID", "W2_12_COLLABORATION_ENGINE_INVALID", "EVIDENCE_CAPTURE_NON_DETERMINISTIC", "RUNTIME_EVENT_NOT_CAPTURED", "PACKAGE_NOT_SIGNED", "PACKAGE_NOT_IMMUTABLE", "PACKAGE_NOT_VERSIONED", "PACKAGE_GENERATION_NON_DETERMINISTIC", "INDEX_RETRIEVAL_NON_DETERMINISTIC", "LINEAGE_TRAVERSAL_INVALID", "SCHEMA_VALIDATION_FAILED", "SIGNATURE_VALIDATION_FAILED", "HASH_VERIFICATION_FAILED", "COMPLETENESS_VALIDATION_FAILED", "REPLAY_COMPATIBILITY_FAILED", "PROVENANCE_INCOMPLETE", "CONTRACT_VERSIONING_MISSING", "CONTRACT_ENFORCEMENT_FAILED", "UNAUTHORIZED_EVIDENCE_ACCESS_ALLOWED", "TENANT_ISOLATION_FAILED", "NAMESPACE_ISOLATION_FAILED", "EVIDENCE_ENCRYPTION_MISSING", "EVIDENCE_REPLAY_INVALID"] as const satisfies readonly EvidenceEngineFailure[];

describe("Evidence Engine W2.13", () => {
  it("publishes the W2.13 evidence doctrine and qualification bundle", () => {
    const bundle = getEvidenceEngineBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "evidence-engine/w2.13",
      owns_evidence_capture: true,
      owns_evidence_packages: true,
      owns_evidence_index: true,
      owns_evidence_validation: true,
      owns_provenance_management: true,
      owns_evidence_contracts: true,
      owns_evidence_explorer: true,
      owns_runtime_integration: true,
      owns_evidence_security: true,
      qualification_gate: "Evidence Engine Qualification Gate",
    });
    expect(bundle.result.readiness.decision).toBe("EVIDENCE_ENGINE_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("anchors deterministic evidence to W2.0 through W2.12", () => {
    const first = runEvidenceEngine();
    const second = runEvidenceEngine();

    expect(first.upstream_refs).toHaveLength(13);
    expect(first.upstream_refs.at(-1)).toBe("collaboration-engine/w2.12");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateEvidenceEngine(first).valid).toBe(true);
    expect(replayEvidenceEngine(first)).toBe(true);
  });

  it("captures runtime evidence and creates signed immutable packages", () => {
    const result = runEvidenceEngine();

    expect(result.capture).toMatchObject({ agent_execution: true, planning_decisions: true, memory_operations: true, tool_execution: true, runtime_events: true, collaboration_events: true, delegation_events: true, policy_evaluations: true, authority_decisions: true, safety_decisions: true, lifecycle_transitions: true, operator_interactions: true, recovery_operations: true, deterministic_capture: true, complete_capture: true });
    expect(result.packages).toMatchObject({ metadata: true, event_sequence: true, runtime_context: true, agent_identity: true, capability_references: true, skill_references: true, decision_records: true, digital_signatures: true, qualification_packages: true, certification_packages: true, immutable: true, signed: true, versioned: true, deterministic_packages: true });
  });

  it("indexes, validates, and tracks complete provenance", () => {
    const result = runEvidenceEngine();

    expect(result.index).toMatchObject({ agent: true, capability: true, skill: true, workflow: true, runtime: true, tenant: true, namespace: true, session: true, policy: true, authority: true, safety: true, correlation_id: true, deterministic_retrieval: true, lineage_traversal: true, provenance_search: true, dependency_search: true, package_discovery: true });
    expect(result.validation_engine).toMatchObject({ schema_validation: true, signature_validation: true, hash_verification: true, provenance_verification: true, lineage_validation: true, contract_validation: true, timestamp_verification: true, completeness_validation: true, replay_compatibility: true, cross_reference_validation: true, corrupted_evidence_detection: true });
    expect(result.provenance).toMatchObject({ source_service: true, runtime: true, agent: true, capability: true, skill: true, policy: true, authority: true, delegation_chain: true, collaboration_chain: true, parent_evidence: true, child_evidence: true, complete_origin_tracking: true });
  });

  it("enforces contracts, explorer access, integration, APIs, and security", () => {
    const result = runEvidenceEngine();

    expect(result.contracts).toMatchObject({ capture_contract: true, package_contract: true, validation_contract: true, search_contract: true, retrieval_contract: true, export_contract: true, replay_contract: true, versioning: true, required_metadata: true, enforced: true });
    expect(result.explorer).toMatchObject({ package_explorer: true, timeline_visualization: true, lineage_viewer: true, validation_status: true, search: true, correlation_viewer: true, replay_links: true, secure_access: true, tenant_isolated: true });
    expect(result.runtime_integration).toMatchObject({ runtime_orchestrator: true, planning_engine: true, memory_engine: true, collaboration_engine: true, delegation_engine: true, policy_gate: true, safety_gate: true, authority_validator: true, lifecycle_engine: true, capability_registry: true, skill_registry: true, evidence_pipeline: true });
    expect(result.apis.submit_evidence).toBe(true);
    expect(result.security).toMatchObject({ tenant_isolation: true, namespace_isolation: true, access_control: true, signed_packages: true, immutable_evidence: true, encryption_at_rest: true, encryption_in_transit: true, authorization_validation: true, tamper_evident: true });
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runEvidenceEngine({ scenario: failure });
    const validation = validateEvidenceEngine(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runEvidenceEngine({ scenario: failure });
    const validation = validateEvidenceEngine(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("marks explicit qualification failure as not qualified", () => {
    const result = runEvidenceEngine({ scenario: "EVIDENCE_ENGINE_QUALIFICATION_FAILED" });

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateEvidenceEngine(result).valid).toBe(false);
  });

  it("records observations and follow-up states as conditional without synthetic failures", () => {
    const observed = runEvidenceEngine({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runEvidenceEngine({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
  });
});
