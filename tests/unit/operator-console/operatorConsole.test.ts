import { describe, expect, it } from "vitest";

import { getOperatorConsoleBundle, replayOperatorConsole, runOperatorConsole, validateOperatorConsole } from "@/services/operator-console";
import type { OperatorConsoleFailure } from "@/types/operator-console";

const conditionalFailures = ["OPERATOR_CONSOLE_MISSING", "DASHBOARD_MISSING", "APPROVAL_QUEUE_MISSING", "EVIDENCE_EXPLORER_MISSING", "REPLAY_EXPLORER_MISSING", "CERTIFICATION_EXPLORER_MISSING", "EMERGENCY_CONTROLS_MISSING", "GOVERNANCE_VIEW_MISSING", "NOTIFICATION_SERVICE_MISSING", "WORKSPACE_ISOLATION_MISSING", "OPERATIONAL_EVIDENCE_MISSING"] as const satisfies readonly OperatorConsoleFailure[];
const failClosedFailures = ["W2_0_CONSTITUTIONAL_FOUNDATION_INVALID", "W2_1_AGENT_REGISTRY_INVALID", "W2_2_LIFECYCLE_ENGINE_INVALID", "W2_3_CAPABILITY_REGISTRY_INVALID", "W2_4_SKILL_REGISTRY_INVALID", "W2_5_AUTHORITY_VALIDATOR_INVALID", "W2_6_POLICY_GATE_INVALID", "W2_7_SAFETY_GATE_INVALID", "W2_8_PLANNING_ENGINE_INVALID", "W2_9_MEMORY_ENGINE_INVALID", "W2_10_RUNTIME_ORCHESTRATOR_INVALID", "W2_11_DELEGATION_ENGINE_INVALID", "W2_12_COLLABORATION_ENGINE_INVALID", "W2_13_EVIDENCE_ENGINE_INVALID", "W2_14_REPLAY_ENGINE_INVALID", "W2_15_CERTIFICATION_ENGINE_INVALID", "DASHBOARD_VISIBILITY_INCOMPLETE", "APPROVAL_SIGNATURE_MISSING", "APPROVAL_EVIDENCE_MISSING", "EVIDENCE_LINEAGE_MISSING", "REPLAY_EXECUTION_NOT_AUTHORIZED", "REPLAY_READ_ONLY_BYPASSED", "CERTIFICATION_DRILLDOWN_MISSING", "EMERGENCY_AUTHORITY_BYPASSED", "EMERGENCY_POLICY_BYPASSED", "EMERGENCY_SAFETY_BYPASSED", "EMERGENCY_AUDIT_MISSING", "OPERATOR_AUTHENTICATION_MISSING", "ROLE_AUTHORIZATION_MISSING", "TENANT_ISOLATION_FAILED", "SIGNED_ACTIONS_MISSING", "AUDIT_LOGGING_MISSING", "OPERATOR_REPLAY_ARTIFACTS_MISSING"] as const satisfies readonly OperatorConsoleFailure[];

describe("Operator Console W2.16", () => {
  it("publishes the W2.16 human control doctrine and qualification gate", () => {
    const bundle = getOperatorConsoleBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "operator-console/w2.16",
      owns_human_control_surface: true,
      owns_operations_dashboard: true,
      owns_approval_queue: true,
      owns_evidence_explorer: true,
      owns_replay_explorer: true,
      owns_certification_explorer: true,
      owns_emergency_controls: true,
      advisory_supervisory_only: true,
      cannot_bypass_constitutional_governance: true,
      qualification_gate: "Operator Console Qualification Gate",
    });
    expect(bundle.result.readiness.decision).toBe("OPERATOR_CONSOLE_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("anchors deterministic console replay to W2.0 through W2.15", () => {
    const first = runOperatorConsole({ seed: "deterministic" });
    const second = runOperatorConsole({ seed: "deterministic" });

    expect(first.upstream_refs).toHaveLength(16);
    expect(first.upstream_refs[0]).toBe("caf-constitutional-foundation/w2.0");
    expect(first.upstream_refs.at(-1)).toBe("certification-engine/w2.15");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateOperatorConsole(first).valid).toBe(true);
    expect(replayOperatorConsole()).toBe(true);
  });

  it("exposes the operations dashboard and approval queue", () => {
    const result = runOperatorConsole();

    expect(result.dashboard).toMatchObject({
      runtime_status: true,
      agent_status: true,
      active_missions: true,
      planning_status: true,
      memory_utilization: true,
      collaboration_sessions: true,
      delegation_graph: true,
      health_indicators: true,
      runtime_alerts: true,
      policy_violations: true,
      safety_events: true,
      certification_status: true,
      evidence_status: true,
      replay_availability: true,
      realtime_visibility: true,
    });
    expect(result.approval_queue).toMatchObject({
      pending_approvals: true,
      escalated_decisions: true,
      constitutional_overrides: true,
      policy_exceptions: true,
      safety_approvals: true,
      delegation_approvals: true,
      runtime_pause_requests: true,
      mission_approvals: true,
      certification_approvals: true,
      qualification_reviews: true,
      authority_source: true,
      evidence_references: true,
      digital_signature: true,
      timestamp: true,
    });
  });

  it("integrates evidence, replay, and certification explorers", () => {
    const result = runOperatorConsole();

    expect(result.evidence_explorer).toMatchObject({ browsing: true, packages: true, lineage_visualization: true, validation: true, search: true, timelines: true, provenance_inspection: true, immutable_references: true, runtime_actions: true, certifications: true, replay_sessions: true });
    expect(result.replay_explorer).toMatchObject({ replay_launch: true, execution_playback: true, timeline_navigation: true, divergence_visualization: true, decision_comparison: true, evidence_overlay: true, runtime_inspection: true, state_comparison: true, replay_reports: true, read_only_by_default: true, authorized_execution_only: true });
    expect(result.certification_explorer).toMatchObject({ agent_certifications: true, capability_certifications: true, skill_certifications: true, runtime_certifications: true, qualification_reports: true, certification_history: true, expiration_tracking: true, certification_evidence: true, certification_lineage: true, artifact_drilldown: true });
  });

  it("keeps emergency controls under constitutional governance", () => {
    const result = runOperatorConsole();

    expect(result.emergency_controls).toMatchObject({ emergency_stop: true, runtime_suspension: true, runtime_isolation: true, mission_cancellation: true, delegation_revocation: true, operator_takeover: true, quarantine: true, safe_shutdown: true, recovery_initiation: true, constitutional_authority: true, policy_validation: true, safety_validation: true, immutable_audit: true, operator_authentication: true, mfa_confirmation: true, governance_bypass_prevented: true });
    expect(result.security).toMatchObject({ authenticated_operators: true, role_based_authorization: true, authority_validation: true, policy_validation: true, safety_validation: true, signed_actions: true, immutable_audit_logging: true, tenant_isolation: true, no_governance_bypass: true });
  });

  it("provides governance views, notifications, workspaces, and evidence output", () => {
    const result = runOperatorConsole();

    expect(result.governance_views).toMatchObject({ authority_decisions: true, policy_decisions: true, safety_decisions: true, lifecycle_state: true, evidence: true, replay: true, certification: true, runtime_health: true, consolidated_visibility: true });
    expect(result.notifications).toMatchObject({ alerts: true, escalations: true, approval_requests: true, emergencies: true, certification_changes: true, deterministic_delivery: true, audit_recorded: true });
    expect(result.workspaces.workspaces).toEqual(["Runtime Operations", "Governance Review", "Evidence Investigation", "Replay Analysis", "Certification Review", "Collaboration Oversight", "Delegation Management", "Safety Monitoring", "Policy Administration", "Emergency Response"]);
    expect(result.workspaces.tenant_isolated).toBe(true);
    expect(result.evidence.records).toHaveLength(10);
    expect(result.evidence).toMatchObject({ operator_actions: true, approval_decisions: true, emergency_actions: true, dashboard_snapshots: true, replay_sessions: true, certification_reviews: true, governance_reviews: true, audit_records: true, session_history: true, operational_evidence: true, immutable: true, lineage_tracked: true, replay_artifacts: true });
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runOperatorConsole({ scenario: failure });
    const validation = validateOperatorConsole(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runOperatorConsole({ scenario: failure });
    const validation = validateOperatorConsole(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runOperatorConsole({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runOperatorConsole({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runOperatorConsole({ scenario: "OPERATOR_CONSOLE_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.phase_ready).toBe(false);
    expect(validateOperatorConsole(notQualified).valid).toBe(false);
  });
});
