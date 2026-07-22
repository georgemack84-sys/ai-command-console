import { describe, expect, it } from "vitest";
import {
  GOVERNANCE_DECISION_ALLOWED_TRANSITIONS,
  GOVERNANCE_DECISION_LIFECYCLE,
  GOVERNANCE_DECISION_STATUSES,
  computeGovernanceDecisionRecordHash,
  createGovernanceDecisionRecord,
  getGovernanceDecisionFilterContractFoundation,
  replayGovernanceDecisionRecord,
  transitionGovernanceDecisionLifecycle,
  validateGovernanceDecisionRecord,
} from "@/services/governance-decision-filter-contract";

describe("Mission Control Phase 9.7.1 Governance Decision Filter Contract", () => {
  it("publishes the authoritative governance decision filter contract foundation", () => {
    const foundation = getGovernanceDecisionFilterContractFoundation();

    expect(foundation.contract_version).toBe("governance-decision-filter-contract/v1");
    expect(foundation.governance_statuses).toEqual(GOVERNANCE_DECISION_STATUSES);
    expect(foundation.lifecycle_states).toEqual(GOVERNANCE_DECISION_LIFECYCLE);
    expect(foundation.allowed_lifecycle_transitions).toEqual(GOVERNANCE_DECISION_ALLOWED_TRANSITIONS);
    expect(foundation.validation.validation_state).toBe("VALID");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("creates deterministic governance records with immutable identity and hash", () => {
    const first = createGovernanceDecisionRecord();
    const second = createGovernanceDecisionRecord();

    expect(first).toEqual(second);
    expect(first.governance_decision_id).toMatch(/^governance_decision_/);
    expect(first.integrity_hash).toBe(computeGovernanceDecisionRecordHash(first));
    expect(first.advisory_only).toBe(true);
  });

  it("validates schema, required references, replay metadata, lineage, tenant ownership, and advisory-only behavior", () => {
    const valid = createGovernanceDecisionRecord();
    const missingField = { ...valid, decision_candidate_id: "", integrity_hash: computeGovernanceDecisionRecordHash({ ...valid, decision_candidate_id: "" }) };
    const missingEvidence = { ...valid, evidence_refs: [], integrity_hash: computeGovernanceDecisionRecordHash({ ...valid, evidence_refs: [] }) };
    const missingReplay = { ...valid, replay_refs: [], integrity_hash: computeGovernanceDecisionRecordHash({ ...valid, replay_refs: [] }) };
    const brokenLineage = { ...valid, lineage_status: "BROKEN" as const, integrity_hash: computeGovernanceDecisionRecordHash({ ...valid, lineage_status: "BROKEN" as const }) };
    const tenantAmbiguous = createGovernanceDecisionRecord({ tenant_id: "tenant_alpha,tenant_beta" });
    const advisoryLeak = { ...valid, advisory_only: false as true, integrity_hash: computeGovernanceDecisionRecordHash({ ...valid, advisory_only: false as true }) };

    expect(validateGovernanceDecisionRecord(valid).validation_state).toBe("VALID");
    expect(validateGovernanceDecisionRecord(missingField).failures).toContain("REQUIRED_FIELD_MISSING");
    expect(validateGovernanceDecisionRecord(missingEvidence).failures).toContain("UNRESOLVED_EVIDENCE_REFERENCE");
    expect(validateGovernanceDecisionRecord(missingReplay).failures).toContain("MISSING_REPLAY_REFERENCE");
    expect(validateGovernanceDecisionRecord(brokenLineage).failures).toContain("LINEAGE_INCOMPLETE");
    expect(validateGovernanceDecisionRecord(tenantAmbiguous).failures).toContain("TENANT_OWNERSHIP_AMBIGUOUS");
    expect(validateGovernanceDecisionRecord(advisoryLeak).failures).toContain("ADVISORY_ONLY_VIOLATION");
  });

  it("rejects duplicate identifiers, invalid schema values, cross-tenant leakage, and integrity drift", () => {
    const valid = createGovernanceDecisionRecord();
    const duplicate = validateGovernanceDecisionRecord(valid, { existing_governance_decision_ids: [valid.governance_decision_id] });
    const invalidSchema = { ...valid, governance_status: "NOT_A_STATUS" as never, integrity_hash: computeGovernanceDecisionRecordHash({ ...valid, governance_status: "NOT_A_STATUS" as never }) };
    const tenantLeak = { ...valid, evidence_refs: ["evidence_tenant_beta_leak"], integrity_hash: computeGovernanceDecisionRecordHash({ ...valid, evidence_refs: ["evidence_tenant_beta_leak"] }) };
    const tampered = { ...valid, mission_id: "tampered_mission" };

    expect(duplicate.failures).toContain("DUPLICATE_GOVERNANCE_DECISION_ID");
    expect(validateGovernanceDecisionRecord(invalidSchema).failures).toContain("INVALID_SCHEMA");
    expect(validateGovernanceDecisionRecord(tenantLeak).failures).toContain("TENANT_ISOLATION_VIOLATION");
    expect(validateGovernanceDecisionRecord(tampered).failures).toContain("INTEGRITY_HASH_MISMATCH");
  });

  it("enforces deterministic lifecycle order and audit events", () => {
    const created = createGovernanceDecisionRecord();
    const registered = transitionGovernanceDecisionLifecycle(created, "REGISTERED");
    const invalid = transitionGovernanceDecisionLifecycle(created, "READY_FOR_ENFORCEMENT");

    expect(registered.validation.validation_state).toBe("VALID");
    expect(registered.record.lifecycle_state).toBe("REGISTERED");
    expect(registered.audit_event.transition_valid).toBe(true);
    expect(invalid.validation.failures).toContain("INVALID_LIFECYCLE_TRANSITION");
    expect(invalid.audit_event.transition_valid).toBe(false);
  });

  it("replays records and lifecycle audit events deterministically", () => {
    const created = createGovernanceDecisionRecord();
    const registered = transitionGovernanceDecisionLifecycle(created, "REGISTERED");
    const replay = replayGovernanceDecisionRecord(registered.record, [registered.audit_event]);
    const tampered = replayGovernanceDecisionRecord({ ...registered.record, integrity_hash: "tampered" }, [registered.audit_event]);

    expect(replay.replay_valid).toBe(true);
    expect(replay.governance_decision_id).toBe(registered.record.governance_decision_id);
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });

  it("emits contract observability from immutable validation and replay records", () => {
    const foundation = getGovernanceDecisionFilterContractFoundation();

    expect(foundation.observability.contract_creation_events).toBe(1);
    expect(foundation.observability.validation_events).toBe(1);
    expect(foundation.observability.lifecycle_transitions).toBe(3);
    expect(foundation.observability.integrity_verification_events).toBe(1);
    expect(foundation.observability.replay_verification_events).toBe(1);
    expect(foundation.observability.enforcement_readiness_events).toBe(1);
  });
});
