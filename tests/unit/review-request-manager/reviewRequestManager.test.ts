import { describe, expect, it } from "vitest";
import { runOverrideManagement } from "@/services/override-management";
import {
  REVIEW_REQUEST_STATES,
  REVIEW_REQUEST_TYPES,
  computeReviewCompletionHash,
  computeReviewDependencyHash,
  computeReviewRequestHash,
  computeWorkflowResumptionHash,
  computeWorkflowSuspensionHash,
  createReviewCompletion,
  createReviewDependency,
  createReviewRequest,
  createWorkflowResumption,
  createWorkflowSuspension,
  getReviewRequestManagerFoundation,
  replayReviewRequestManager,
  runReviewRequestManager,
} from "@/services/review-request-manager";

const foundation = getReviewRequestManagerFoundation();
const baseOverride = foundation.result.override_result;

describe("Mission Control Phase 9.9.6 Review Request Manager", () => {
  it("publishes the review request manager foundation", () => {
    expect(foundation.review_manager_version).toBe("review-request-manager/v1");
    expect(foundation.review_request_types).toEqual(REVIEW_REQUEST_TYPES);
    expect(foundation.review_states).toEqual(REVIEW_REQUEST_STATES);
    expect(foundation.result.review_manager_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("registers review requests, creates dependencies, suspends and resumes deterministically", () => {
    const first = runReviewRequestManager({ override_result: baseOverride });
    const second = runReviewRequestManager({ override_result: baseOverride });

    expect(first).toEqual(second);
    expect(first.review_request.request_type).toBe("GOVERNANCE_REVIEW");
    expect(first.review_dependency.dependency_type).toBe("GOVERNANCE_DEPENDENCY");
    expect(first.suspension_record.suspension_status).toBe("SUSPENDED");
    expect(first.completion_record.completion_status).toBe("COMPLETED");
    expect(first.resumption_record.workflow_resumed).toBe(true);
    expect(first.review_ledger[0]?.review_state).toBe("WORKFLOW_RESUMED");
  });

  it("supports all review request types with deterministic dependency mapping", () => {
    const base = createReviewRequest(baseOverride);
    const cases = [
      ["MORE_EVIDENCE", "EVIDENCE_DEPENDENCY", "Reviewer"],
      ["SIMULATION", "SIMULATION_DEPENDENCY", "Reviewer"],
      ["GOVERNANCE_REVIEW", "GOVERNANCE_DEPENDENCY", "Governance Authority"],
      ["RECOVERY_PLAN", "RECOVERY_DEPENDENCY", "Reviewer"],
      ["CERTIFICATION_REVIEW", "CERTIFICATION_DEPENDENCY", "Certification Authority"],
    ] as const;

    for (const [request_type, dependency_type, authority_level] of cases) {
      const request = { ...base, review_request_id: `review_request_${request_type}`, request_type, authority_level };
      const reviewRequest = { ...request, integrity_hash: computeReviewRequestHash(request) };
      const result = runReviewRequestManager({ override_result: baseOverride, review_request: reviewRequest });

      expect(result.review_manager_status).toBe("PASS");
      expect(result.review_dependency.dependency_type).toBe(dependency_type);
    }
  });

  it("fails closed for unknown request types, unauthorized requesters, and missing justification", () => {
    const base = createReviewRequest(baseOverride);
    const unknown = { ...base, request_type: "SHADOW_REVIEW", integrity_hash: computeReviewRequestHash({ ...base, request_type: "SHADOW_REVIEW" }) };
    const weakAuthority = { ...base, request_type: "GOVERNANCE_REVIEW", authority_level: "Reviewer", integrity_hash: computeReviewRequestHash({ ...base, request_type: "GOVERNANCE_REVIEW", authority_level: "Reviewer" }) };
    const missingJustification = { ...base, justification: "", integrity_hash: computeReviewRequestHash({ ...base, justification: "" }) };

    expect(runReviewRequestManager({ override_result: baseOverride, review_request: unknown }).failures).toContain("REQUEST_TYPE_UNKNOWN");
    expect(runReviewRequestManager({ override_result: baseOverride, review_request: weakAuthority }).failures).toContain("REQUESTER_UNAUTHORIZED");
    expect(runReviewRequestManager({ override_result: baseOverride, review_request: missingJustification }).failures).toContain("JUSTIFICATION_MISSING");
  });

  it("fails closed for dependency, suspension, completion, governance, and certification blockers", () => {
    const request = createReviewRequest(baseOverride);
    const dependency = createReviewDependency(request);
    const completion = createReviewCompletion(request, dependency);
    const suspension = createWorkflowSuspension(baseOverride, request);
    const resumption = createWorkflowResumption(request, dependency, completion);
    const badDependency = { ...dependency, dependency_status: "PENDING" as const, integrity_hash: computeReviewDependencyHash({ ...dependency, dependency_status: "PENDING" as const }) };
    const badSuspension = { ...suspension, suspension_status: "FAILED" as const, integrity_hash: computeWorkflowSuspensionHash({ ...suspension, suspension_status: "FAILED" as const }) };
    const badCompletion = { ...completion, completion_status: "INCOMPLETE" as const, integrity_hash: computeReviewCompletionHash({ ...completion, completion_status: "INCOMPLETE" as const }) };
    const badResumption = { ...resumption, workflow_resumed: false, dependencies_resolved: false, integrity_hash: computeWorkflowResumptionHash({ ...resumption, workflow_resumed: false, dependencies_resolved: false }) };
    const certificationRequest = { ...request, request_type: "CERTIFICATION_REVIEW", authority_level: "Certification Authority", certification_required: true };
    const certRequest = { ...certificationRequest, integrity_hash: computeReviewRequestHash(certificationRequest) };

    expect(runReviewRequestManager({ override_result: baseOverride, review_dependency: badDependency }).failures).toContain("REQUIRED_REVIEW_INCOMPLETE");
    expect(runReviewRequestManager({ override_result: baseOverride, suspension_record: badSuspension }).failures).toContain("WORKFLOW_SUSPENSION_FAILED");
    expect(runReviewRequestManager({ override_result: baseOverride, completion_record: badCompletion }).failures).toContain("REQUIRED_REVIEW_INCOMPLETE");
    expect(runReviewRequestManager({ override_result: baseOverride, resumption_record: badResumption }).failures).toContain("REQUIRED_REVIEW_INCOMPLETE");
    expect(runReviewRequestManager({ override_result: baseOverride, review_request: certRequest, completion_record: badCompletion }).failures).toContain("CERTIFICATION_REVIEW_INCOMPLETE");
  });

  it("enforces override integration, tenant, mission, constitutional, replay, lineage, advisory-only, and integrity rules", () => {
    const badOverride = runOverrideManagement({ authorized_component: "unknown" });
    const base = createReviewRequest(baseOverride);
    const badTenant = { ...base, tenant_id: "tenant_beta", integrity_hash: computeReviewRequestHash({ ...base, tenant_id: "tenant_beta" }) };
    const badMission = { ...base, mission_id: "mission_beta", integrity_hash: computeReviewRequestHash({ ...base, mission_id: "mission_beta" }) };
    const badConstitution = { ...base, constitutional_validated: false, integrity_hash: computeReviewRequestHash({ ...base, constitutional_validated: false }) };
    const missingReplay = { ...base, replay_ref: "", lineage_ref: "", integrity_hash: computeReviewRequestHash({ ...base, replay_ref: "", lineage_ref: "" }) };
    const notAdvisory = { ...base, advisory_only: false as true, integrity_hash: computeReviewRequestHash({ ...base, advisory_only: false as true }) };
    const tampered = { ...base, requested_by: "tampered" };

    expect(runReviewRequestManager({ override_result: badOverride }).failures).toContain("OVERRIDE_MANAGEMENT_FAILED");
    expect(runReviewRequestManager({ override_result: baseOverride, review_request: badTenant }).failures).toContain("TENANT_MISMATCH");
    expect(runReviewRequestManager({ override_result: baseOverride, review_request: badMission }).failures).toContain("MISSION_MISMATCH");
    expect(runReviewRequestManager({ override_result: baseOverride, review_request: badConstitution }).failures).toContain("CONSTITUTIONAL_VALIDATION_FAILED");
    expect(runReviewRequestManager({ override_result: baseOverride, review_request: missingReplay }).failures).toEqual(expect.arrayContaining(["REPLAY_REFERENCE_UNAVAILABLE", "LINEAGE_INCOMPLETE"]));
    expect(runReviewRequestManager({ override_result: baseOverride, review_request: notAdvisory }).failures).toContain("ADVISORY_ONLY_VIOLATION");
    expect(runReviewRequestManager({ override_result: baseOverride, review_request: tampered }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
    expect(runReviewRequestManager({ override_result: baseOverride, authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_REVIEW_MANAGER_ACCESS");
  });

  it("replays review request management deterministically and detects replay divergence", () => {
    const valid = runReviewRequestManager({ override_result: baseOverride });
    const replay = replayReviewRequestManager(valid);
    const mismatch = runReviewRequestManager({ override_result: baseOverride, replay_expected_hash: `${valid.replay_hash}_wrong` });
    const tamperedReplay = replayReviewRequestManager({ ...valid, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.workflow_resumed).toBe(true);
    expect(mismatch.failures).toContain("REPLAY_DIVERGENCE");
    expect(tamperedReplay.replay_valid).toBe(false);
    expect(tamperedReplay.failures).toContain("REPLAY_DIVERGENCE");
  });
});
