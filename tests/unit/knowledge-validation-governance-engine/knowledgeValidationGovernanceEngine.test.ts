import { describe, expect, it } from "vitest";
import {
  buildKnowledgeValidationObservabilitySurface,
  getKnowledgeValidationGovernanceEngine,
  listCertificationReadinessRecords,
  listKnowledgeValidationAuditRecords,
  listKnowledgeValidationRecords,
  validateKnowledgeGovernance,
  validateKnowledgeValidationRepository,
} from "@/services/knowledge-validation-governance-engine";
import type { KnowledgeValidationFailure, KnowledgeValidationScenario } from "@/types/knowledge-validation-governance-engine";

describe("knowledge validation governance engine", () => {
  it("publishes the deterministic validation governance bundle", () => {
    const bundle = getKnowledgeValidationGovernanceEngine();

    expect(bundle.doctrine.engine_version).toBe("knowledge-validation-governance-engine/v8ALT.9.7");
    expect(bundle.doctrine.final_state).toBe("KNOWLEDGE_VALIDATION_GOVERNANCE_READY");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.read_only).toBe(true);
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.certification_authorized).toBe(false);
    expect(bundle.repository.activation_authorized).toBe(false);
    expect(bundle.repository.operator_approval_bypass_authorized).toBe(false);
  });

  it("validates candidate artifacts into readiness records without certifying them", () => {
    const repository = validateKnowledgeGovernance();

    expect(repository.final_state).toBe("KNOWLEDGE_VALIDATION_COMPLETE");
    expect(repository.validation_records.length).toBeGreaterThan(0);
    expect(repository.readiness_records.length).toBe(repository.validation_records.length);
    expect(repository.validation_records.every((record) => record.readiness_state === "READY_FOR_CERTIFICATION")).toBe(true);
    expect(repository.validation_records.every((record) => record.approval_required)).toBe(true);
    expect(repository.validation_records.every((record) => !record.certification_authorized)).toBe(true);
    expect(repository.validation_records.every((record) => !record.activation_authorized)).toBe(true);
  });

  it("lists validation, readiness, and audit projections", () => {
    expect(listKnowledgeValidationRecords().length).toBeGreaterThan(0);
    expect(listCertificationReadinessRecords().length).toBeGreaterThan(0);
    expect(listKnowledgeValidationAuditRecords().length).toBe(0);
  });

  it("keeps validation read-only, advisory-only, and tenant-isolated", () => {
    const repository = validateKnowledgeGovernance();

    expect(repository.validation_records.every((record) => record.read_only)).toBe(true);
    expect(repository.validation_records.every((record) => record.advisory_only)).toBe(true);
    expect(repository.validation_records.every((record) => record.tenant_id === "tenant:alpha")).toBe(true);
    expect(repository.validation_records.every((record) => record.operator_approval_bypass_authorized === false)).toBe(true);
    expect(repository.validation_records.every((record) => record.governance_modification_authorized === false)).toBe(true);
    expect(repository.validation_records.every((record) => record.constitutional_modification_authorized === false)).toBe(true);
  });

  it("is deterministic for identical candidate repositories", () => {
    const first = validateKnowledgeGovernance();
    const second = validateKnowledgeGovernance();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.validation_records.map((record) => record.validation_id)).toEqual(first.validation_records.map((record) => record.validation_id));
    expect(second.validation_records.map((record) => record.deterministic_signature)).toEqual(first.validation_records.map((record) => record.deterministic_signature));
  });

  it.each([
    ["INVALID_SCHEMA", "INVALID_SCHEMA_DETECTED"],
    ["MISSING_EVIDENCE", "MISSING_EVIDENCE_DETECTED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["NONDETERMINISTIC_BEHAVIOR", "NONDETERMINISTIC_BEHAVIOR_DETECTED"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_VIOLATION_DETECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_DETECTED"],
    ["AUTHORITY_CONFLICT", "AUTHORITY_CONFLICT_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_FAILURE_DETECTED"],
    ["LINEAGE_BREAK", "LINEAGE_BREAK_DETECTED"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE_DETECTED"],
    ["INCOMPLETE_EXPLAINABILITY", "INCOMPLETE_EXPLAINABILITY_DETECTED"],
    ["DUPLICATE_CERTIFIED_IDENTIFIER", "DUPLICATE_CERTIFIED_IDENTIFIER_DETECTED"],
    ["CERTIFICATION_ATTEMPTED", "CERTIFICATION_ATTEMPTED"],
    ["ACTIVATION_ATTEMPTED", "ACTIVATION_ATTEMPTED"],
    ["GOVERNANCE_BYPASS_ATTEMPTED", "GOVERNANCE_BYPASS_ATTEMPTED"],
    ["OPERATOR_APPROVAL_BYPASS_ATTEMPTED", "OPERATOR_APPROVAL_BYPASS_ATTEMPTED"],
  ] satisfies [KnowledgeValidationScenario, KnowledgeValidationFailure][])("fails closed and audits %s", (scenario, failure) => {
    const repository = validateKnowledgeGovernance({ scenario });
    const validation = validateKnowledgeValidationRepository(repository);

    expect(repository.final_state).toBe("KNOWLEDGE_VALIDATION_REJECTED");
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(repository.audit_records.some((record) => record.rejection_reason === failure)).toBe(true);
    expect(repository.audit_records.every((record) => record.immutable && record.append_only)).toBe(true);
  });

  it("publishes validation observability", () => {
    const surface = buildKnowledgeValidationObservabilitySurface();

    expect(surface.final_state).toBe("KNOWLEDGE_VALIDATION_COMPLETE");
    expect(surface.validation_count).toBeGreaterThan(0);
    expect(surface.readiness_count).toBe(surface.validation_count);
    expect(surface.rejected_count).toBe(0);
    expect(surface.certification_authorized).toBe(false);
    expect(surface.activation_authorized).toBe(false);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
