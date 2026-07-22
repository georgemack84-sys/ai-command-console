import { describe, expect, it } from "vitest";
import { certifyDecisionPackage } from "@/services/decision-package-certification-gate";
import {
  OPERATOR_WORKFLOW_AUTHORITY_LEVELS,
  OPERATOR_WORKFLOW_LIFECYCLE_STATES,
  computeOperatorDecisionWorkflowHash,
  computeWorkflowAuthorityContractHash,
  computeWorkflowAuditRecordHash,
  computeWorkflowIdentityRecordHash,
  computeWorkflowLifecycleContractHash,
  computeWorkflowOwnershipRecordHash,
  computeWorkflowReplayRegistrationHash,
  createOperatorDecisionWorkflow,
  createOperatorWorkflowContract,
  createWorkflowIdentityRecord,
  defineWorkflowAuthority,
  defineWorkflowLifecycle,
  getOperatorWorkflowContractFoundation,
  replayOperatorWorkflowContract,
} from "@/services/operator-workflow-contract";

describe("Mission Control Phase 9.9.1 Operator Workflow Contract", () => {
  it("publishes the operator workflow contract foundation", () => {
    const foundation = getOperatorWorkflowContractFoundation();

    expect(foundation.contract_version).toBe("operator-workflow-contract/v1");
    expect(foundation.lifecycle_states).toEqual(OPERATOR_WORKFLOW_LIFECYCLE_STATES);
    expect(foundation.authority_levels).toEqual(OPERATOR_WORKFLOW_AUTHORITY_LEVELS);
    expect(foundation.result.contract_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("creates deterministic workflow identity, ownership, authority, lifecycle, replay, and audit records", () => {
    const first = createOperatorWorkflowContract();
    const second = createOperatorWorkflowContract();

    expect(first).toEqual(second);
    expect(first.workflow.workflow_state).toBe("PENDING_REVIEW");
    expect(first.identity.workflow_id).toBe(first.workflow.workflow_id);
    expect(first.ownership.operator_id).toBe(first.workflow.operator_id);
    expect(first.authority.authority_level).toBe("Operator");
    expect(first.replay_registration.replay_reproducible).toBe(true);
    expect(first.audit_record.recorded_events).toContain("Workflow creation");
    expect(first.workflow_ledger).toHaveLength(1);
  });

  it("defines legal lifecycle boundaries without processing transitions", () => {
    const result = createOperatorWorkflowContract();

    expect(result.lifecycle.initial_state).toBe("PENDING_REVIEW");
    expect(result.lifecycle.terminal_states).toEqual(["APPROVED", "REJECTED", "ARCHIVED"]);
    expect(result.lifecycle.legal_transitions.PENDING_REVIEW).toEqual(["IN_REVIEW", "DEFERRED", "ESCALATED"]);
    expect(result.lifecycle.legal_transitions.ARCHIVED).toEqual([]);
    expect(result.validation.lifecycle_valid).toBe(true);
  });

  it("fails closed for missing identity, duplicate workflow, ownership, authority, lifecycle, replay, and lineage failures", () => {
    const certification = certifyDecisionPackage();
    const workflow = createOperatorDecisionWorkflow(certification);
    const identity = createWorkflowIdentityRecord(workflow);
    const lifecycle = defineWorkflowLifecycle(workflow);
    const authority = defineWorkflowAuthority(certification, workflow);

    expect(createOperatorWorkflowContract({ workflow: { ...workflow, workflow_id: "", integrity_hash: computeOperatorDecisionWorkflowHash({ ...workflow, workflow_id: "" }) } }).failures).toContain("WORKFLOW_IDENTITY_MISSING");
    expect(createOperatorWorkflowContract({ identity: { ...identity, unique: false, integrity_hash: computeWorkflowIdentityRecordHash({ ...identity, unique: false }) } }).failures).toContain("DUPLICATE_WORKFLOW_DETECTED");
    expect(createOperatorWorkflowContract({ ownership: { ...createOperatorWorkflowContract().ownership, operator_id: "", integrity_hash: computeWorkflowOwnershipRecordHash({ ...createOperatorWorkflowContract().ownership, operator_id: "" }) } }).failures).toContain("OWNERSHIP_INVALID");
    expect(createOperatorWorkflowContract({ authority: { ...authority, authority_level: "Observer", permitted_authorities: [], integrity_hash: computeWorkflowAuthorityContractHash({ ...authority, authority_level: "Observer", permitted_authorities: [] }) } }).failures).toContain("AUTHORITY_UNDEFINED");
    expect(createOperatorWorkflowContract({ lifecycle: { ...lifecycle, initial_state: "IN_REVIEW", integrity_hash: computeWorkflowLifecycleContractHash({ ...lifecycle, initial_state: "IN_REVIEW" }) } }).failures).toContain("LIFECYCLE_INVALID");
    expect(createOperatorWorkflowContract({ replay_registration: { ...createOperatorWorkflowContract().replay_registration, replay_ref: "", integrity_hash: computeWorkflowReplayRegistrationHash({ ...createOperatorWorkflowContract().replay_registration, replay_ref: "" }) } }).failures).toContain("REPLAY_UNAVAILABLE");
    expect(createOperatorWorkflowContract({ workflow: { ...workflow, lineage_ref: "", integrity_hash: computeOperatorDecisionWorkflowHash({ ...workflow, lineage_ref: "" }) } }).failures).toContain("LINEAGE_MISSING");
  });

  it("rejects invalid certification, governance/constitutional failures, tenant mismatch, advisory violation, unauthorized access, replay divergence, and tampering", () => {
    const valid = createOperatorWorkflowContract();
    const badCertification = { ...valid.certification_result, gate_status: "FAIL" as const };
    const badAuthority = { ...valid.authority, governance_compliant: false, constitutional_compliant: false, integrity_hash: computeWorkflowAuthorityContractHash({ ...valid.authority, governance_compliant: false, constitutional_compliant: false }) };

    expect(createOperatorWorkflowContract({ certification_result: badCertification }).failures).toContain("CERTIFICATION_GATE_NOT_PASS");
    expect(createOperatorWorkflowContract({ authority: badAuthority }).failures).toEqual(expect.arrayContaining(["GOVERNANCE_VALIDATION_FAILED", "CONSTITUTIONAL_VALIDATION_FAILED"]));
    expect(createOperatorWorkflowContract({ workflow: { ...valid.workflow, tenant_id: "tenant_beta", integrity_hash: computeOperatorDecisionWorkflowHash({ ...valid.workflow, tenant_id: "tenant_beta" }) } }).failures).toContain("TENANT_VALIDATION_FAILED");
    expect(createOperatorWorkflowContract({ workflow: { ...valid.workflow, advisory_only: false as true, integrity_hash: computeOperatorDecisionWorkflowHash({ ...valid.workflow, advisory_only: false as true }) } }).failures).toContain("ADVISORY_ONLY_VIOLATION");
    expect(createOperatorWorkflowContract({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_WORKFLOW_CONTRACT_ACCESS");
    expect(createOperatorWorkflowContract({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
    expect(createOperatorWorkflowContract({ audit_record: { ...valid.audit_record, recorded_events: [], integrity_hash: computeWorkflowAuditRecordHash({ ...valid.audit_record, recorded_events: [] }) } }).validation.integrity_valid).toBe(true);
    expect(createOperatorWorkflowContract({ workflow: { ...valid.workflow, operator_id: "tampered" } }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
  });

  it("replays operator workflow contracts deterministically", () => {
    const result = createOperatorWorkflowContract();
    const replay = replayOperatorWorkflowContract(result);
    const tampered = replayOperatorWorkflowContract({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.workflow_id).toBe(result.workflow.workflow_id);
    expect(replay.authority_level).toBe(result.workflow.authority_level);
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
