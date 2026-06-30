import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import {
  buildConstitutionalDecisionLedger,
  buildConstitutionalRequest,
  buildConstitutionalVisibilitySurface,
  computeConstitutionalDecisionHash,
  computeConstitutionalRequestHash,
  decideConstitutionalRequest,
  getConstitutionalConstraintsFramework,
  replayConstitutionalDecisions,
  validateConstitutionalRequest,
} from "@/services/autonomy-constitutional-constraints";
import type { ConstitutionalScenario } from "@/types/autonomy-constitutional-constraints";

describe("Mission Control Phase 8A.5 Constitutional Constraints", () => {
  it("builds a deterministic constitutional request", () => {
    const identity = generateAutonomyIdentity();
    const request = buildConstitutionalRequest(identity);
    expect(request.mission_constitution).toBe("mission-constitution:v8A");
    expect(request.governance_constitution).toBe("governance-constitution:v8A");
    expect(request.evidence_references.length).toBeGreaterThan(0);
    expect(computeConstitutionalRequestHash(request)).toBe(request.integrity_hash);
  });

  it("approves a fully documented constitutional request", () => {
    const identity = generateAutonomyIdentity();
    const result = decideConstitutionalRequest(identity);
    expect(result.validation.validation_state).toBe("PASS");
    expect(result.validation.decision).toBe("APPROVED");
    expect(result.decision.decision).toBe("APPROVED");
    expect(computeConstitutionalDecisionHash(result.decision)).toBe(result.decision.integrity_hash);
  });

  it.each([
    ["UNAUTHORIZED_EXECUTION", "MISSION_SCOPE_VIOLATION"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION"],
    ["POLICY_BYPASS", "POLICY_BYPASS"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["HIDDEN_AUTONOMY", "OPERATOR_BYPASS"],
    ["CROSS_TENANT", "CROSS_TENANT_ACCESS"],
    ["UNDOCUMENTED_EXECUTION", "REPLAY_REFERENCE_MISSING"],
    ["SELF_MODIFICATION", "SELF_MODIFICATION"],
    ["CONSTITUTION_MODIFICATION", "CONSTITUTION_MODIFICATION"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["REPLAY_DIVERGENCE", "REPLAY_REFERENCE_MISSING"],
    ["AUDIT_GAP", "AUDIT_RECORD_MISSING"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [ConstitutionalScenario, string][])("denies scenario %s", (scenario, reason) => {
    const identity = generateAutonomyIdentity();
    const result = decideConstitutionalRequest(identity, scenario);
    expect(result.validation.decision).toBe("DENIED");
    expect(result.validation.failures).toContain(reason as never);
    expect(result.decision.denial_reason).toBeTruthy();
  });

  it("validates all constitutional dimensions fail-closed", () => {
    const identity = generateAutonomyIdentity();
    const request = buildConstitutionalRequest(identity, "UNDOCUMENTED_EXECUTION");
    const validation = validateConstitutionalRequest(identity, request);
    expect(validation.fail_closed).toBe(true);
    expect(validation.replay_ready).toBe(false);
    expect(validation.evidence_complete).toBe(false);
    expect(validation.audit_ready).toBe(false);
  });

  it("records immutable approval and denial decisions", () => {
    const identity = generateAutonomyIdentity();
    const approved = decideConstitutionalRequest(identity).decision;
    const denied = decideConstitutionalRequest(identity, "GOVERNANCE_BYPASS").decision;
    const ledger = buildConstitutionalDecisionLedger([approved, denied]);
    expect(ledger.decisions).toHaveLength(2);
    expect(ledger.approvals).toHaveLength(1);
    expect(ledger.denials).toHaveLength(1);
    expect(ledger.ledger_hash).toBeTruthy();
  });

  it("replays constitutional decisions deterministically", () => {
    const identity = generateAutonomyIdentity();
    const ledger = buildConstitutionalDecisionLedger([decideConstitutionalRequest(identity).decision]);
    const replay = replayConstitutionalDecisions(ledger);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.evaluation_order).toEqual(["MISSION", "GOVERNANCE", "POLICY", "OPERATOR", "TENANT", "REPLAY", "EVIDENCE", "AUDIT", "INTEGRITY"]);
    expect(replay.reconstructed_decisions).toEqual(["APPROVED"]);
  });

  it("detects replay integrity mismatch", () => {
    const identity = generateAutonomyIdentity();
    const ledger = buildConstitutionalDecisionLedger([decideConstitutionalRequest(identity, "INTEGRITY_MISMATCH").decision]);
    const replay = replayConstitutionalDecisions(ledger);
    expect(replay.validation_state).toBe("FAIL");
    expect(replay.failure_reason).toBe("INTEGRITY_HASH_MISMATCH");
  });

  it("exposes constitutional visibility without hidden decisions", () => {
    const identity = generateAutonomyIdentity();
    const ledger = buildConstitutionalDecisionLedger([decideConstitutionalRequest(identity).decision, decideConstitutionalRequest(identity, "POLICY_BYPASS").decision]);
    const visibility = buildConstitutionalVisibilitySurface(ledger);
    expect(visibility.hidden_decisions_visible).toBe(false);
    expect(visibility.denial_reasons).toContain("POLICY_BYPASS");
    expect(visibility.evidence_chain.length).toBeGreaterThan(0);
    expect(visibility.integrity_status).toBe("VALID");
  });

  it("publishes aggregate constitutional framework", () => {
    const framework = getConstitutionalConstraintsFramework();
    expect(framework.validation.decision).toBe("APPROVED");
    expect(framework.ledger.decisions.length).toBeGreaterThan(0);
    expect(framework.visibility.rules_evaluated.length).toBeGreaterThan(0);
  });
});
