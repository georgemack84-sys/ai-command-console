import { describe, expect, it } from "vitest";
import { runApprovalManagement } from "@/services/approval-management-engine";
import {
  OVERRIDE_STATES,
  computeOverrideLineageHash,
  computeOverrideNotificationHash,
  computeOverrideRecordHash,
  computeOverrideRequestHash,
  createOverrideLineage,
  createOverrideNotification,
  createOverrideRecord,
  createOverrideRequest,
  getOverrideManagementFoundation,
  replayOverrideManagement,
  runOverrideManagement,
} from "@/services/override-management";

const foundation = getOverrideManagementFoundation();
const baseApproval = foundation.result.approval_result;

describe("Mission Control Phase 9.9.5 Override Management", () => {
  it("publishes the override management foundation", () => {
    expect(foundation.override_management_version).toBe("override-management/v1");
    expect(foundation.override_states).toEqual(OVERRIDE_STATES);
    expect(foundation.result.override_management_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("records overrides deterministically while preserving the original recommendation", () => {
    const first = runOverrideManagement({ approval_result: baseApproval });
    const second = runOverrideManagement({ approval_result: baseApproval });

    expect(first).toEqual(second);
    expect(first.override_record.original_recommendation).toBe(baseApproval.action_result.action_result.outcome_summary);
    expect(first.explanation_report.recommendation_preserved).toBe(true);
    expect(first.override_record.operator_action).toBe("OVERRIDE_RECOMMENDATION");
    expect(first.override_ledger[0]?.override_state).toBe("FINALIZED");
    expect(first.override_ledger[0]?.append_only).toBe(true);
  });

  it("generates governance notification, lineage, explanation, and replay references", () => {
    const result = runOverrideManagement({ approval_result: baseApproval });

    expect(result.notification_record.governance_required).toBe(true);
    expect(result.notification_record.notification_status).toBe("REGISTERED");
    expect(result.lineage_record.recommendation_ref).toBe(result.override_request.original_recommendation_ref);
    expect(result.lineage_record.governance_ref).toBe(result.notification_record.notification_id);
    expect(result.explanation_report.rationale_summary).toContain(result.override_request.override_reason);
    expect(result.validation.replay_valid).toBe(true);
  });

  it("fails closed for missing reason, justification, mission impact, evidence, and recommendation reference", () => {
    const base = createOverrideRequest(baseApproval);
    const noReason = { ...base, override_reason: "", integrity_hash: computeOverrideRequestHash({ ...base, override_reason: "" }) };
    const noJustification = { ...base, business_justification: "", integrity_hash: computeOverrideRequestHash({ ...base, business_justification: "" }) };
    const noMissionImpact = { ...base, mission_impact: "", integrity_hash: computeOverrideRequestHash({ ...base, mission_impact: "" }) };
    const noEvidence = { ...base, supporting_evidence_refs: [], integrity_hash: computeOverrideRequestHash({ ...base, supporting_evidence_refs: [] }) };
    const noRecommendation = { ...base, original_recommendation_ref: "", integrity_hash: computeOverrideRequestHash({ ...base, original_recommendation_ref: "" }) };

    expect(runOverrideManagement({ approval_result: baseApproval, override_request: noReason }).failures).toContain("OVERRIDE_REASON_MISSING");
    expect(runOverrideManagement({ approval_result: baseApproval, override_request: noJustification }).failures).toContain("JUSTIFICATION_MISSING");
    expect(runOverrideManagement({ approval_result: baseApproval, override_request: noMissionImpact }).failures).toContain("MISSION_IMPACT_MISSING");
    expect(runOverrideManagement({ approval_result: baseApproval, override_request: noEvidence }).failures).toContain("SUPPORTING_EVIDENCE_MISSING");
    expect(runOverrideManagement({ approval_result: baseApproval, override_request: noRecommendation }).failures).toContain("ORIGINAL_RECOMMENDATION_UNAVAILABLE");
  });

  it("fails closed for unauthorized operators, governance and constitutional failures, tenant and mission mismatch", () => {
    const base = createOverrideRequest(baseApproval);
    const weakAuthority = { ...base, authority_level: "Operator", integrity_hash: computeOverrideRequestHash({ ...base, authority_level: "Operator" }) };
    const governanceFailure = { ...base, governance_authorized: false, constitutional_authorized: false, integrity_hash: computeOverrideRequestHash({ ...base, governance_authorized: false, constitutional_authorized: false }) };
    const badTenant = { ...base, tenant_id: "tenant_beta", integrity_hash: computeOverrideRequestHash({ ...base, tenant_id: "tenant_beta" }) };
    const badMission = { ...base, mission_id: "mission_beta", integrity_hash: computeOverrideRequestHash({ ...base, mission_id: "mission_beta" }) };
    const unauthenticated = { ...base, operator_authenticated: false, integrity_hash: computeOverrideRequestHash({ ...base, operator_authenticated: false }) };

    expect(runOverrideManagement({ approval_result: baseApproval, override_request: weakAuthority }).failures).toContain("OPERATOR_UNAUTHORIZED");
    expect(runOverrideManagement({ approval_result: baseApproval, override_request: unauthenticated }).failures).toContain("OPERATOR_UNAUTHORIZED");
    expect(runOverrideManagement({ approval_result: baseApproval, override_request: governanceFailure }).failures).toEqual(expect.arrayContaining(["GOVERNANCE_VALIDATION_FAILED", "CONSTITUTIONAL_VALIDATION_FAILED"]));
    expect(runOverrideManagement({ approval_result: baseApproval, override_request: badTenant }).failures).toContain("TENANT_MISMATCH");
    expect(runOverrideManagement({ approval_result: baseApproval, override_request: badMission }).failures).toContain("MISSION_MISMATCH");
  });

  it("enforces approval integration, replay, lineage, advisory-only, and integrity requirements", () => {
    const badApproval = runApprovalManagement({ authorized_component: "unknown" });
    const base = createOverrideRequest(baseApproval);
    const missingReplay = { ...base, replay_ref: "", lineage_ref: "", integrity_hash: computeOverrideRequestHash({ ...base, replay_ref: "", lineage_ref: "" }) };
    const notAdvisory = { ...base, advisory_only: false as true, integrity_hash: computeOverrideRequestHash({ ...base, advisory_only: false as true }) };
    const tamperedRecord = { ...createOverrideRecord(baseApproval, base), override_reason: "tampered" };

    expect(runOverrideManagement({ approval_result: badApproval }).failures).toEqual(expect.arrayContaining(["APPROVAL_MANAGEMENT_FAILED", "WORKFLOW_INVALID"]));
    expect(runOverrideManagement({ approval_result: baseApproval, override_request: missingReplay }).failures).toEqual(expect.arrayContaining(["REPLAY_REFERENCE_UNAVAILABLE", "LINEAGE_INCOMPLETE"]));
    expect(runOverrideManagement({ approval_result: baseApproval, override_request: notAdvisory }).failures).toContain("ADVISORY_ONLY_VIOLATION");
    expect(runOverrideManagement({ approval_result: baseApproval, override_record: tamperedRecord }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
    expect(runOverrideManagement({ approval_result: baseApproval, authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_OVERRIDE_ENGINE_ACCESS");
  });

  it("detects tampered lineage and governance notifications", () => {
    const request = createOverrideRequest(baseApproval);
    const record = createOverrideRecord(baseApproval, request);
    const notification = createOverrideNotification(record, request);
    const lineage = createOverrideLineage(baseApproval, record, notification, request);
    const badNotification = { ...notification, replay_ref: "", integrity_hash: computeOverrideNotificationHash({ ...notification, replay_ref: "" }) };
    const badLineage = { ...lineage, parent_lineage: "", integrity_hash: computeOverrideLineageHash({ ...lineage, parent_lineage: "" }) };
    const hiddenRecommendation = { ...record, original_recommendation: "", integrity_hash: computeOverrideRecordHash({ ...record, original_recommendation: "" }) };

    expect(runOverrideManagement({ approval_result: baseApproval, notification_record: badNotification }).failures).toContain("REPLAY_REFERENCE_UNAVAILABLE");
    expect(runOverrideManagement({ approval_result: baseApproval, lineage_record: badLineage }).failures).toContain("LINEAGE_INCOMPLETE");
    expect(runOverrideManagement({ approval_result: baseApproval, override_record: hiddenRecommendation }).failures).toContain("ORIGINAL_RECOMMENDATION_UNAVAILABLE");
  });

  it("replays override management deterministically and detects replay divergence", () => {
    const valid = runOverrideManagement({ approval_result: baseApproval });
    const replay = replayOverrideManagement(valid);
    const mismatch = runOverrideManagement({ approval_result: baseApproval, replay_expected_hash: `${valid.replay_hash}_wrong` });
    const tamperedReplay = replayOverrideManagement({ ...valid, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.original_recommendation).toBe(valid.override_record.original_recommendation);
    expect(mismatch.failures).toContain("REPLAY_DIVERGENCE");
    expect(tamperedReplay.replay_valid).toBe(false);
    expect(tamperedReplay.failures).toContain("REPLAY_DIVERGENCE");
  });
});
