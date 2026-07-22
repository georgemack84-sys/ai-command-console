import { describe, expect, it } from "vitest";
import {
  buildKnowledgeActivationObservabilitySurface,
  getKnowledgeActivationOperatorApprovalEngine,
  listActiveKnowledgeRecords,
  listKnowledgeActivationApprovals,
  listKnowledgeActivationAudits,
  listKnowledgeActivationLedger,
  listKnowledgeRollbackRecords,
  requestKnowledgeActivation,
  validateKnowledgeActivation,
} from "@/services/knowledge-activation-operator-approval-engine";
import type { KnowledgeActivationFailure, KnowledgeActivationScenario } from "@/types/knowledge-activation-operator-approval-engine";

describe("knowledge activation operator approval engine", () => {
  it("publishes the deterministic activation engine bundle", () => {
    const bundle = getKnowledgeActivationOperatorApprovalEngine();

    expect(bundle.doctrine.engine_version).toBe("knowledge-activation-operator-approval-engine/v8ALT.9.9");
    expect(bundle.doctrine.final_state).toBe("KNOWLEDGE_ACTIVATION_OPERATOR_APPROVAL_READY");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.human_authorization_required).toBe(true);
    expect(bundle.repository.autonomous_activation_authorized).toBe(false);
    expect(bundle.repository.autonomous_approval_authorized).toBe(false);
    expect(bundle.repository.runtime_behavior_modification_authorized).toBe(false);
  });

  it("records operator-approved activation without runtime mutation authority", () => {
    const repository = requestKnowledgeActivation();

    expect(repository.final_state).toBe("KNOWLEDGE_ACTIVATION_RECORDED");
    expect(repository.activation_records.length).toBeGreaterThan(0);
    expect(repository.active_records.length).toBe(repository.activation_records.length);
    expect(repository.activation_records.every((record) => record.approval_status === "APPROVED")).toBe(true);
    expect(repository.activation_records.every((record) => record.human_authorized)).toBe(true);
    expect(repository.activation_records.every((record) => record.activation_state === "ACTIVATED")).toBe(true);
    expect(repository.activation_records.every((record) => !record.runtime_behavior_modification_authorized)).toBe(true);
  });

  it("emits append-only activation, supersession, and rollback ledger events", () => {
    const repository = requestKnowledgeActivation();

    expect(repository.ledger_entries.length).toBe(repository.activation_records.length * 6);
    expect(repository.ledger_entries.every((entry) => entry.immutable && entry.append_only)).toBe(true);
    expect(repository.ledger_entries.some((entry) => entry.event_type === "ACTIVATION_RECORDED")).toBe(true);
    expect(repository.ledger_entries.some((entry) => entry.event_type === "SUPERSESSION_RECORDED")).toBe(true);
    expect(repository.ledger_entries.some((entry) => entry.event_type === "ROLLBACK_RECORDED")).toBe(true);
  });

  it("lists approvals, active records, ledger entries, rollback records, and audits", () => {
    expect(listKnowledgeActivationApprovals().length).toBeGreaterThan(0);
    expect(listActiveKnowledgeRecords().length).toBeGreaterThan(0);
    expect(listKnowledgeActivationLedger().length).toBeGreaterThan(0);
    expect(listKnowledgeRollbackRecords().length).toBeGreaterThan(0);
    expect(listKnowledgeActivationAudits().length).toBe(0);
  });

  it("is deterministic for identical activation requests", () => {
    const first = requestKnowledgeActivation();
    const second = requestKnowledgeActivation();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.activation_records.map((record) => record.activation_id)).toEqual(first.activation_records.map((record) => record.activation_id));
    expect(second.ledger_entries.map((entry) => entry.activation_ledger_entry_id)).toEqual(first.ledger_entries.map((entry) => entry.activation_ledger_entry_id));
  });

  it("keeps activation tenant-isolated and non-autonomous", () => {
    const repository = requestKnowledgeActivation();

    expect(repository.activation_records.every((record) => record.tenant_id === "tenant:alpha")).toBe(true);
    expect(repository.activation_records.every((record) => !record.autonomous_activation_authorized)).toBe(true);
    expect(repository.activation_records.every((record) => !record.autonomous_approval_authorized)).toBe(true);
    expect(repository.activation_records.every((record) => !record.repository_mutation_authorized)).toBe(true);
    expect(repository.activation_records.every((record) => !record.history_rewrite_authorized)).toBe(true);
    expect(repository.activation_records.every((record) => !record.activation_history_deletion_authorized)).toBe(true);
  });

  it.each([
    ["INCOMPLETE_CERTIFICATION", "CERTIFICATION_INCOMPLETE"],
    ["VALIDATION_FAILURE", "VALIDATION_FAILED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_FAILURE_DETECTED"],
    ["GOVERNANCE_REJECTION", "GOVERNANCE_REJECTED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["AUTHORITY_CONFLICT", "AUTHORITY_CONFLICT_DETECTED"],
    ["OPERATOR_REJECTION", "OPERATOR_REJECTED"],
    ["MISSING_OPERATOR_APPROVAL", "OPERATOR_APPROVAL_MISSING"],
    ["UNSATISFIED_DEPENDENCIES", "DEPENDENCIES_UNSATISFIED"],
    ["DUPLICATE_ACTIVATION", "DUPLICATE_ACTIVATION_DETECTED"],
    ["AUTONOMOUS_APPROVAL_ATTEMPT", "AUTONOMOUS_APPROVAL_ATTEMPTED"],
    ["AUTONOMOUS_ACTIVATION_ATTEMPT", "AUTONOMOUS_ACTIVATION_ATTEMPTED"],
    ["REPOSITORY_MUTATION_ATTEMPT", "REPOSITORY_MUTATION_ATTEMPTED"],
    ["HISTORY_REWRITE_ATTEMPT", "HISTORY_REWRITE_ATTEMPTED"],
    ["ACTIVATION_HISTORY_DELETION_ATTEMPT", "ACTIVATION_HISTORY_DELETION_ATTEMPTED"],
    ["CROSS_TENANT_ACTIVATION", "CROSS_TENANT_ACTIVATION_DETECTED"],
  ] satisfies [KnowledgeActivationScenario, KnowledgeActivationFailure][])("fails closed and audits %s", (scenario, failure) => {
    const repository = requestKnowledgeActivation({ scenario });
    const validation = validateKnowledgeActivation(repository);

    expect(repository.final_state).toBe("KNOWLEDGE_ACTIVATION_REJECTED");
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(repository.audit_records.some((record) => record.rejection_reason === failure)).toBe(true);
    expect(repository.ledger_entries.some((entry) => entry.event_type === "ACTIVATION_REJECTED")).toBe(true);
  });

  it("publishes activation observability", () => {
    const surface = buildKnowledgeActivationObservabilitySurface();

    expect(surface.final_state).toBe("KNOWLEDGE_ACTIVATION_RECORDED");
    expect(surface.activation_count).toBeGreaterThan(0);
    expect(surface.active_count).toBe(surface.activation_count);
    expect(surface.approval_count).toBe(surface.activation_count);
    expect(surface.ledger_count).toBe(surface.activation_count * 6);
    expect(surface.autonomous_activation_authorized).toBe(false);
    expect(surface.runtime_behavior_modification_authorized).toBe(false);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
