import { describe, expect, it } from "vitest";
import {
  buildSupervisionInterventionReplayPackage,
  buildSupervisionInterventionVisibilitySurface,
  computeGovernanceReplayHash,
  computeHealthTimelineHash,
  computeInterventionTimelineHash,
  computeSupervisionReplayIdentityHash,
  computeSupervisionReplayValidationHash,
  computeSupervisionTimelineHash,
  getSupervisionInterventionReplayFramework,
} from "@/services/supervision-intervention-replay";
import type { SupervisionInterventionReplayFailure, SupervisionInterventionReplayScenario } from "@/types/supervision-intervention-replay";

describe("Mission Control Phase 8G.4 Supervision & Intervention Replay", () => {
  it("publishes supervision intervention replay doctrine", () => {
    const framework = getSupervisionInterventionReplayFramework();

    expect(framework.doctrine.engine_version).toBe("supervision-intervention-replay/v8G.4");
    expect(framework.doctrine.principles).toContain("no-speculative-supervision");
    expect(framework.doctrine.supervision_event_types).toContain("BOUNDARY_ENFORCEMENT");
    expect(framework.doctrine.intervention_event_types).toContain("RECOVERY_RECOMMENDATION");
    expect(framework.doctrine.health_categories).toEqual(["EXECUTION", "ORCHESTRATION", "PLANNING", "DELEGATION", "SUPERVISION", "GOVERNANCE", "INTEGRITY", "REPLAY"]);
  });

  it("replays a complete immutable baseline supervision package", () => {
    const pkg = buildSupervisionInterventionReplayPackage();

    expect(Object.isFrozen(pkg)).toBe(true);
    expect(pkg.engine_version).toBe("supervision-intervention-replay/v8G.4");
    expect(pkg.validation.outcome).toBe("VERIFIED");
    expect(pkg.validation.certification_ready).toBe(true);
    expect(pkg.validation.speculative_history_generated).toBe(false);
    expect(pkg.speculative_supervision_permitted).toBe(false);
    expect(pkg.supervision_timeline).toHaveLength(7);
    expect(pkg.intervention_timeline).toHaveLength(6);
    expect(pkg.health_timeline).toHaveLength(8);
    expect(pkg.governance_replay.governance_decision).toBe("APPROVED");
  });

  it("produces deterministic hashes across replay artifacts", () => {
    const first = buildSupervisionInterventionReplayPackage();
    const second = buildSupervisionInterventionReplayPackage();

    expect(second.package_hash).toBe(first.package_hash);
    expect(computeSupervisionReplayIdentityHash(first.identity)).toBe(first.identity.integrity_hash);
    expect(computeSupervisionTimelineHash(first.supervision_timeline)).toBe(computeSupervisionTimelineHash(second.supervision_timeline));
    expect(computeInterventionTimelineHash(first.intervention_timeline)).toBe(computeInterventionTimelineHash(second.intervention_timeline));
    expect(computeHealthTimelineHash(first.health_timeline)).toBe(computeHealthTimelineHash(second.health_timeline));
    expect(computeGovernanceReplayHash(first.governance_replay)).toBe(first.governance_replay.governance_hash);
    expect(computeSupervisionReplayValidationHash(first.validation)).toBe(first.validation.validation_hash);
  });

  it("replays policy, constitution, confidence, boundary, intervention, recovery, and health evidence", () => {
    const pkg = buildSupervisionInterventionReplayPackage();

    expect(pkg.supervision_timeline.map((event) => event.event_type)).toContain("POLICY_EVALUATION");
    expect(pkg.supervision_timeline.map((event) => event.event_type)).toContain("CONSTITUTION_EVALUATION");
    expect(pkg.supervision_timeline.map((event) => event.event_type)).toContain("CONFIDENCE_CALCULATION");
    expect(pkg.supervision_timeline.map((event) => event.event_type)).toContain("BOUNDARY_ENFORCEMENT");
    expect(pkg.intervention_timeline.map((event) => event.event_type)).toContain("ROLLBACK_RECOMMENDATION");
    expect(pkg.intervention_timeline.map((event) => event.event_type)).toContain("PAUSE_RECOMMENDATION");
    expect(pkg.intervention_timeline.map((event) => event.event_type)).toContain("RECOVERY_RECOMMENDATION");
  });

  it.each([
    ["SUPERVISION_DIVERGENCE", "SUPERVISION_DIVERGENCE", "MISMATCH"],
    ["POLICY_MISMATCH", "POLICY_MISMATCH", "INVALID"],
    ["CONSTITUTIONAL_MISMATCH", "CONSTITUTIONAL_MISMATCH", "INVALID"],
    ["INTERVENTION_MISMATCH", "INTERVENTION_MISMATCH", "MISMATCH"],
    ["ROLLBACK_MISMATCH", "ROLLBACK_MISMATCH", "MISMATCH"],
    ["PAUSE_MISMATCH", "PAUSE_MISMATCH", "MISMATCH"],
    ["RECOVERY_MISMATCH", "RECOVERY_MISMATCH", "MISMATCH"],
    ["CONFIDENCE_MISMATCH", "CONFIDENCE_MISMATCH", "MISMATCH"],
    ["HEALTH_MISMATCH", "HEALTH_MISMATCH", "MISMATCH"],
    ["GOVERNANCE_INCONSISTENCY", "GOVERNANCE_INCONSISTENCY", "INVALID"],
    ["MISSING_RUNTIME_EVIDENCE", "MISSING_RUNTIME_EVIDENCE", "PARTIAL"],
    ["INTEGRITY_FAILURE", "INTEGRITY_FAILURE", "INVALID"],
    ["LINEAGE_BREAK", "LINEAGE_BREAK", "INVALID"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION", "INVALID"],
  ] as readonly [SupervisionInterventionReplayScenario, SupervisionInterventionReplayFailure, string][])("fails closed for %s", (scenario, failure, outcome) => {
    const pkg = buildSupervisionInterventionReplayPackage({ scenario });

    expect(pkg.validation.outcome).toBe(outcome);
    expect(pkg.validation.failures).toContain(failure);
    expect(pkg.validation.certification_ready).toBe(false);
    expect(pkg.validation.speculative_history_generated).toBe(false);
    expect(pkg.speculative_supervision_permitted).toBe(false);
  });

  it("exposes concise replay visibility", () => {
    const surface = buildSupervisionInterventionVisibilitySurface(buildSupervisionInterventionReplayPackage({ scenario: "CONFIDENCE_MISMATCH" }));

    expect(surface.outcome).toBe("MISMATCH");
    expect(surface.failure_reasons).toContain("CONFIDENCE_MISMATCH");
    expect(surface.supervision_events).toBe(7);
    expect(surface.intervention_events).toBe(6);
    expect(surface.certification_ready).toBe(false);
  });
});
