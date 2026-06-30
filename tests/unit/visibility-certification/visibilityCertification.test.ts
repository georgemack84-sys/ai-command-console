import { describe, expect, it } from "vitest";
import {
  buildVisibilityCertificationGateContract,
  buildVisibilityCertificationView,
  certifyIntegrityViewer,
  certifyLedgerExplorer,
  certifyReplayViewer,
  certifyTruthDashboard,
  createVisibilityCertificationAuditEvent,
  runVisibilityCertification,
  runVisibilityDeterminismChecks,
} from "@/services/visibility-certification";

function contract() {
  return buildVisibilityCertificationGateContract({
    tenant_id: "tenant_alpha",
    operator_id: "operator_console",
    certification_run_id: "visibility_cert_run_6k5_test",
    mission_ids: ["mission_query_layer"],
  });
}

describe("Mission Control Phase 6K.5 Visibility Certification Gate", () => {
  it("creates a visibility certification gate contract", () => {
    const result = contract();
    expect(result.scope.surfaces).toContain("TRUTH_DASHBOARD");
    expect(result.governance_requirements.read_only_required).toBe(true);
    expect(result.determinism_requirements.certification_replayable).toBe(true);
  });

  it("allows only pass, conditional pass, and fail certification states", () => {
    expect(contract().certification_states.allowed_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
  });

  it("certifies Truth Dashboard coverage", () => {
    const result = certifyTruthDashboard(contract());
    expect(result.state).toBe("PASS");
    expect(result.targets.map((target) => target.capability)).toContain("RECOMMENDATION_DISPLAY");
    expect(result.targets.map((target) => target.capability)).toContain("FAIL_CLOSED");
  });

  it("certifies Replay Viewer coverage", () => {
    const result = certifyReplayViewer(contract());
    expect(result.state).toBe("PASS");
    expect(result.targets.map((target) => target.capability)).toContain("REPLAY_DISPLAY");
    expect(result.targets.map((target) => target.capability)).toContain("REDACTION");
  });

  it("certifies Ledger Explorer coverage", () => {
    const result = certifyLedgerExplorer(contract());
    expect(result.state).toBe("PASS");
    expect(result.targets.map((target) => target.capability)).toContain("LEDGER_NAVIGATION");
    expect(result.targets.map((target) => target.capability)).toContain("INTEGRITY_DISPLAY");
  });

  it("certifies Integrity Status Viewer coverage", () => {
    const result = certifyIntegrityViewer(contract());
    expect(result.state).toBe("PASS");
    expect(result.targets.map((target) => target.capability)).toContain("HASH_CHAIN_DISPLAY");
    expect(result.targets.map((target) => target.capability)).toContain("TAMPER_DISPLAY");
  });

  it("runs the complete visibility certification", () => {
    const result = runVisibilityCertification(contract());
    expect(result.certification_state).toBe("PASS");
    expect(result.gate_state).toBe("PASSED");
    expect(result.surface_results).toHaveLength(4);
  });

  it("keeps the certification result read-only", () => {
    const result = runVisibilityCertification(contract());
    expect(result.readOnly).toBe(true);
    expect(result.mutationAllowed).toBe(false);
    expect(result.approvalAllowed).toBe(false);
    expect(result.executionAllowed).toBe(false);
    expect(result.repairAllowed).toBe(false);
    expect(result.governanceOverrideAllowed).toBe(false);
  });

  it("verifies all surfaces emit audit evidence", () => {
    const result = runVisibilityCertification(contract());
    expect(result.surface_results.every((surface) => surface.evidence_refs.length > 0)).toBe(true);
    expect(result.audit_events.every((event) => event.appendOnly)).toBe(true);
  });

  it("verifies redaction targets pass", () => {
    const result = runVisibilityCertification(contract());
    const redactionTargets = result.targets.filter((target) => target.capability === "REDACTION");
    expect(redactionTargets).toHaveLength(4);
    expect(redactionTargets.every((target) => target.certification_state === "PASS")).toBe(true);
  });

  it("verifies fail-closed targets pass", () => {
    const result = runVisibilityCertification(contract());
    const failClosedTargets = result.targets.filter((target) => target.capability === "FAIL_CLOSED");
    expect(failClosedTargets).toHaveLength(4);
    expect(failClosedTargets.every((target) => target.certification_state === "PASS")).toBe(true);
  });

  it("verifies authority blockers through fail-closed targets", () => {
    const result = runVisibilityCertification(contract());
    expect(result.targets.filter((target) => target.capability === "FAIL_CLOSED").flatMap((target) => target.evidence_refs)).toEqual(expect.arrayContaining([
      "truth-dashboard:read-only",
      "replay-viewer:read-only",
      "ledger-explorer:read-only",
      "integrity-viewer:read-only",
    ]));
  });

  it("runs deterministic visibility checks", () => {
    const checks = runVisibilityDeterminismChecks(contract());
    expect(checks).toHaveLength(4);
    expect(checks.every((check) => check.result_match && check.ordering_match)).toBe(true);
  });

  it("keeps certification replayable", () => {
    const first = runVisibilityCertification(contract());
    const second = runVisibilityCertification(contract());
    expect(first.certification_state).toBe(second.certification_state);
    expect(first.targets.map((target) => target.target_id)).toEqual(second.targets.map((target) => target.target_id));
  });

  it("produces no failures for a passing certification", () => {
    expect(runVisibilityCertification(contract()).failures).toEqual([]);
  });

  it("produces no remediation for a passing certification", () => {
    expect(runVisibilityCertification(contract()).remediation).toEqual([]);
  });

  it("generates a certification report", () => {
    const result = runVisibilityCertification(contract());
    expect(result.report.summary).toBe("Phase 6K visibility certification passed.");
    expect(result.report.surface_results).toHaveLength(4);
  });

  it("records an immutable certification ledger entry", () => {
    const result = runVisibilityCertification(contract());
    expect(result.ledger_entry.appendOnly).toBe(true);
    expect(result.ledger_entry.mutationAllowed).toBe(false);
    expect(result.ledger_entry.certification_state).toBe("PASS");
  });

  it("collects certification evidence refs", () => {
    const result = runVisibilityCertification(contract());
    expect(result.evidence_refs).toContain("truth-dashboard:recommendation");
    expect(result.evidence_refs).toContain("integrity-viewer:hash-chain");
  });

  it("fails closed when tenant context is missing", () => {
    const broken = buildVisibilityCertificationGateContract({ tenant_id: "", operator_id: "operator_console" });
    const result = runVisibilityCertification(broken);
    expect(result.gate_state).toBe("FAIL_CLOSED");
    expect(result.certification_state).toBe("FAIL");
    expect(result.remediation[0].certification_blocking).toBe(true);
  });

  it("fails closed when operator context is missing", () => {
    const broken = buildVisibilityCertificationGateContract({ tenant_id: "tenant_alpha", operator_id: "" });
    expect(runVisibilityCertification(broken).gate_state).toBe("FAIL_CLOSED");
  });

  it("supports scoped surface certification", () => {
    const scoped = buildVisibilityCertificationGateContract({ tenant_id: "tenant_alpha", operator_id: "operator_console", surfaces: ["INTEGRITY_STATUS_VIEWER"] });
    const result = runVisibilityCertification(scoped);
    expect(result.surface_results).toHaveLength(1);
    expect(result.surface_results[0].surface).toBe("INTEGRITY_STATUS_VIEWER");
  });

  it("creates append-only audit events", () => {
    const event = createVisibilityCertificationAuditEvent({
      contract: contract(),
      event_type: "REPORT_VIEWED",
      target_ref: "visibility_cert_run_6k5_test",
    });
    expect(event.appendOnly).toBe(true);
    expect(event.sourceMutationAllowed).toBe(false);
  });

  it("builds the operator certification view", () => {
    const view = buildVisibilityCertificationView({ tenant_id: "tenant_alpha", operator_id: "operator_console" });
    expect(view.result.certification_state).toBe("PASS");
    expect(view.guardrails).toContain("no hash repair");
  });

  it("certifies truth dashboard recommendation, decision, evidence, lineage, replay, and integrity visibility", () => {
    const capabilities = certifyTruthDashboard(contract()).targets.map((target) => target.capability);
    expect(capabilities).toEqual(expect.arrayContaining(["RECOMMENDATION_DISPLAY", "DECISION_DISPLAY", "EVIDENCE_DISPLAY", "LINEAGE_DISPLAY", "REPLAY_DISPLAY", "INTEGRITY_DISPLAY"]));
  });

  it("certifies replay reconstruction and governance visibility through replay display evidence", () => {
    const result = certifyReplayViewer(contract());
    expect(result.evidence_refs).toEqual(expect.arrayContaining(["replay-viewer:summary", "replay-viewer:governance", "replay-viewer:integrity"]));
  });

  it("certifies ledger timeline graph governance runtime and integrity coverage", () => {
    const result = certifyLedgerExplorer(contract());
    expect(result.evidence_refs).toEqual(expect.arrayContaining(["ledger-explorer:navigation", "ledger-explorer:governance", "ledger-explorer:integrity"]));
  });

  it("certifies integrity tamper verification and certification coverage", () => {
    const result = certifyIntegrityViewer(contract());
    expect(result.evidence_refs).toEqual(expect.arrayContaining(["integrity-viewer:tamper", "integrity-viewer:verification", "integrity-viewer:certification"]));
  });
});
