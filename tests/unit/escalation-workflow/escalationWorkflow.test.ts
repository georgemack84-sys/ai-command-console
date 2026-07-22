import { describe, expect, it } from "vitest";
import { runReviewRequestManager } from "@/services/review-request-manager";
import {
  ESCALATION_STATES,
  ESCALATION_TYPES,
  computeEscalationRecordHash,
  computeEscalationRequestHash,
  computeEscalationResolutionHash,
  computeEscalationRoutingHash,
  computeEscalationSuspensionHash,
  createEscalationRecord,
  createEscalationRequest,
  createEscalationResolution,
  createEscalationRouting,
  createEscalationSuspension,
  getEscalationWorkflowFoundation,
  replayEscalationWorkflow,
  runEscalationWorkflow,
} from "@/services/escalation-workflow";

const foundation = getEscalationWorkflowFoundation();
const baseReview = foundation.result.review_result;

describe("Mission Control Phase 9.9.7 Escalation Workflow", () => {
  it("publishes the escalation workflow foundation", () => {
    expect(foundation.escalation_workflow_version).toBe("escalation-workflow/v1");
    expect(foundation.escalation_types).toEqual(ESCALATION_TYPES);
    expect(foundation.escalation_states).toEqual(ESCALATION_STATES);
    expect(foundation.result.escalation_workflow_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("routes, suspends, records, resolves, and resumes deterministically", () => {
    const first = runEscalationWorkflow({ review_result: baseReview });
    const second = runEscalationWorkflow({ review_result: baseReview });

    expect(first).toEqual(second);
    expect(first.escalation_request.escalation_type).toBe("GOVERNANCE_ESCALATION");
    expect(first.routing_decision.routing_outcome).toBe("governance_queue");
    expect(first.suspension_record.suspension_status).toBe("SUSPENDED");
    expect(first.escalation_record.resolution_status).toBe("RESOLVED");
    expect(first.escalation_resolution.resulting_workflow_state).toBe("WORKFLOW_RESUMED");
    expect(first.escalation_ledger[0]?.escalation_state).toBe("WORKFLOW_RESUMED");
  });

  it("supports every escalation type with deterministic destination routing", () => {
    const base = createEscalationRequest(baseReview);
    const cases = [
      ["GOVERNANCE_ESCALATION", "Governance Authority", "governance_queue", "Supervisor"],
      ["CONSTITUTIONAL_ESCALATION", "Constitutional Authority", "constitutional_queue", "Executive Authority"],
      ["SUPERVISORY_ESCALATION", "Supervisor", "supervisory_queue", "Operator"],
      ["EXECUTIVE_ESCALATION", "Executive Authority", "executive_queue", "Governance Authority"],
      ["CERTIFICATION_ESCALATION", "Certification Authority", "certification_queue", "Executive Authority"],
    ] as const;

    for (const [escalation_type, destination_authority, routing_outcome, requesting_authority] of cases) {
      const request = { ...base, escalation_request_id: `escalation_request_${escalation_type}`, escalation_type, destination_authority, requesting_authority };
      const escalationRequest = { ...request, integrity_hash: computeEscalationRequestHash(request) };
      const result = runEscalationWorkflow({ review_result: baseReview, escalation_request: escalationRequest });

      expect(result.escalation_workflow_status).toBe("PASS");
      expect(result.routing_decision.routing_outcome).toBe(routing_outcome);
      expect(result.escalation_record.destination_authority).toBe(destination_authority);
    }
  });

  it("fails closed for unknown escalation types, invalid authorities, missing reason, and unroutable paths", () => {
    const base = createEscalationRequest(baseReview);
    const unknown = { ...base, escalation_type: "SHADOW_ESCALATION", integrity_hash: computeEscalationRequestHash({ ...base, escalation_type: "SHADOW_ESCALATION" }) };
    const weakAuthority = { ...base, requesting_authority: "Executive Authority", destination_authority: "Supervisor", integrity_hash: computeEscalationRequestHash({ ...base, requesting_authority: "Executive Authority", destination_authority: "Supervisor" }) };
    const badDestination = { ...base, destination_authority: "Unknown Authority", integrity_hash: computeEscalationRequestHash({ ...base, destination_authority: "Unknown Authority" }) };
    const noReason = { ...base, escalation_reason: "", integrity_hash: computeEscalationRequestHash({ ...base, escalation_reason: "" }) };
    const routing = createEscalationRouting(base);
    const unroutable = { ...routing, routing_status: "UNROUTABLE" as const, routing_path: [], integrity_hash: computeEscalationRoutingHash({ ...routing, routing_status: "UNROUTABLE" as const, routing_path: [] }) };

    expect(runEscalationWorkflow({ review_result: baseReview, escalation_request: unknown }).failures).toContain("ESCALATION_TYPE_UNKNOWN");
    expect(runEscalationWorkflow({ review_result: baseReview, escalation_request: weakAuthority }).failures).toContain("REQUESTING_AUTHORITY_UNAUTHORIZED");
    expect(runEscalationWorkflow({ review_result: baseReview, escalation_request: badDestination }).failures).toContain("DESTINATION_AUTHORITY_INVALID");
    expect(runEscalationWorkflow({ review_result: baseReview, escalation_request: noReason }).failures).toContain("ESCALATION_REASON_MISSING");
    expect(runEscalationWorkflow({ review_result: baseReview, routing_decision: unroutable }).failures).toContain("ROUTING_UNDETERMINED");
  });

  it("fails closed for invalid workflow, suspension, governance, constitutional, and certification resolution gaps", () => {
    const base = createEscalationRequest(baseReview);
    const suspension = createEscalationSuspension(baseReview, base);
    const routing = createEscalationRouting(base);
    const record = createEscalationRecord(base, routing);
    const badWorkflow = { ...base, workflow_id: "workflow_beta", integrity_hash: computeEscalationRequestHash({ ...base, workflow_id: "workflow_beta" }) };
    const badSuspension = { ...suspension, suspension_status: "FAILED" as const, integrity_hash: computeEscalationSuspensionHash({ ...suspension, suspension_status: "FAILED" as const }) };
    const unresolvedRecord = { ...record, resolution_status: "UNRESOLVED" as const, integrity_hash: computeEscalationRecordHash({ ...record, resolution_status: "UNRESOLVED" as const }) };
    const constitutional = { ...base, escalation_type: "CONSTITUTIONAL_ESCALATION", requesting_authority: "Executive Authority", destination_authority: "Constitutional Authority" };
    const constitutionalRequest = { ...constitutional, integrity_hash: computeEscalationRequestHash(constitutional) };
    const certification = { ...base, escalation_type: "CERTIFICATION_ESCALATION", requesting_authority: "Executive Authority", destination_authority: "Certification Authority" };
    const certificationRequest = { ...certification, integrity_hash: computeEscalationRequestHash(certification) };

    expect(runEscalationWorkflow({ review_result: baseReview, escalation_request: badWorkflow }).failures).toContain("WORKFLOW_INVALID");
    expect(runEscalationWorkflow({ review_result: baseReview, suspension_record: badSuspension }).failures).toContain("WORKFLOW_SUSPENSION_FAILED");
    expect(runEscalationWorkflow({ review_result: baseReview, escalation_record: unresolvedRecord }).failures).toContain("GOVERNANCE_ESCALATION_INCOMPLETE");
    expect(runEscalationWorkflow({ review_result: baseReview, escalation_request: constitutionalRequest, escalation_record: unresolvedRecord }).failures).toContain("CONSTITUTIONAL_ESCALATION_UNRESOLVED");
    expect(runEscalationWorkflow({ review_result: baseReview, escalation_request: certificationRequest, escalation_record: unresolvedRecord }).failures).toContain("CERTIFICATION_ESCALATION_UNRESOLVED");
  });

  it("enforces review integration, tenant, mission, replay, lineage, advisory-only, and integrity validation", () => {
    const badReview = runReviewRequestManager({ authorized_component: "unknown" });
    const base = createEscalationRequest(baseReview);
    const badTenant = { ...base, tenant_id: "tenant_beta", integrity_hash: computeEscalationRequestHash({ ...base, tenant_id: "tenant_beta" }) };
    const badMission = { ...base, mission_id: "mission_beta", integrity_hash: computeEscalationRequestHash({ ...base, mission_id: "mission_beta" }) };
    const missingReplay = { ...base, replay_ref: "", lineage_ref: "", integrity_hash: computeEscalationRequestHash({ ...base, replay_ref: "", lineage_ref: "" }) };
    const notAdvisory = { ...base, advisory_only: false as true, integrity_hash: computeEscalationRequestHash({ ...base, advisory_only: false as true }) };
    const tampered = { ...base, escalation_reason: "tampered" };

    expect(runEscalationWorkflow({ review_result: badReview }).failures).toContain("REVIEW_MANAGER_FAILED");
    expect(runEscalationWorkflow({ review_result: baseReview, escalation_request: badTenant }).failures).toContain("TENANT_MISMATCH");
    expect(runEscalationWorkflow({ review_result: baseReview, escalation_request: badMission }).failures).toContain("MISSION_MISMATCH");
    expect(runEscalationWorkflow({ review_result: baseReview, escalation_request: missingReplay }).failures).toEqual(expect.arrayContaining(["REPLAY_REFERENCE_UNAVAILABLE", "LINEAGE_INCOMPLETE"]));
    expect(runEscalationWorkflow({ review_result: baseReview, escalation_request: notAdvisory }).failures).toContain("ADVISORY_ONLY_VIOLATION");
    expect(runEscalationWorkflow({ review_result: baseReview, escalation_request: tampered }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
    expect(runEscalationWorkflow({ review_result: baseReview, authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_ESCALATION_WORKFLOW_ACCESS");
  });

  it("detects resolution tampering and replay divergence", () => {
    const valid = runEscalationWorkflow({ review_result: baseReview });
    const replay = replayEscalationWorkflow(valid);
    const resolution = createEscalationResolution(valid.escalation_record, valid.escalation_request);
    const badResolution = { ...resolution, resulting_workflow_state: "WORKFLOW_HELD" as const, integrity_hash: computeEscalationResolutionHash({ ...resolution, resulting_workflow_state: "WORKFLOW_HELD" as const }) };
    const mismatch = runEscalationWorkflow({ review_result: baseReview, replay_expected_hash: `${valid.replay_hash}_wrong` });
    const tamperedReplay = replayEscalationWorkflow({ ...valid, replay_hash: "tampered" });

    expect(runEscalationWorkflow({ review_result: baseReview, escalation_resolution: badResolution }).validation.escalation_resolved).toBe(true);
    expect(replay.replay_valid).toBe(true);
    expect(mismatch.failures).toContain("REPLAY_DIVERGENCE");
    expect(tamperedReplay.replay_valid).toBe(false);
    expect(tamperedReplay.failures).toContain("REPLAY_DIVERGENCE");
  });
});
