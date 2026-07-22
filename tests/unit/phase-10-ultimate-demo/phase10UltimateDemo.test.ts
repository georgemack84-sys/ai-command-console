import { describe, expect, it } from "vitest";

import { replayPhase10UltimateDemo, runPhase10UltimateDemo } from "../../../services/phase-10-ultimate-demo";

describe("phase 10 ultimate demo", () => {
  it("runs deterministically with identical replay hashes", () => {
    const first = runPhase10UltimateDemo();
    const second = runPhase10UltimateDemo();

    expect(first.status).toBe("PASS");
    expect(first.deterministic_hash).toBe(second.deterministic_hash);
    expect(first.replay.replay_hash).toBe(second.replay.replay_hash);
    expect(first.replay.divergence).toBe(0);
    expect(replayPhase10UltimateDemo(first)).toBe(true);
  });

  it("preserves governance, constitutional constraints, and operator authority", () => {
    const demo = runPhase10UltimateDemo();

    expect(demo.mission.governance_state).toBe("ENFORCED");
    expect(demo.mission.constitutional_state).toBe("ENFORCED");
    expect(demo.mission.operator_authority).toBe("HUMAN_FINAL_AUTHORITY");
    expect(demo.recommendations.every((item) => item.constitutional_validation === "PASS")).toBe(true);
    expect(demo.operator_actions.every((item) => item.authoritative)).toBe(true);
    expect(demo.certification.advisory_only).toBe(true);
  });

  it("detects and contains every chaos attack", () => {
    const demo = runPhase10UltimateDemo();

    expect(demo.chaos_results).toHaveLength(14);
    expect(demo.chaos_results.every((attack) => attack.detected && attack.contained && attack.fail_closed)).toBe(true);
    expect(demo.recommendations.find((item) => item.recommendation_id === "rec-continue-alpha")?.state).toBe("SUPPRESSED");
  });

  it("shows measurable improvement over baselines without governance loss", () => {
    const demo = runPhase10UltimateDemo();
    const missionControl = demo.comparisons.find((row) => row.comparator === "Mission Control Phase 10");
    const baselines = demo.comparisons.filter((row) => row.comparator !== "Mission Control Phase 10");

    expect(missionControl).toBeDefined();
    expect(missionControl?.governance_compliance).toBe(100);
    expect(missionControl?.replay_fidelity).toBe(100);
    expect(baselines.every((row) => missionControl!.decision_quality > row.decision_quality)).toBe(true);
  });

  it("certifies all mandatory demo invariants", () => {
    const demo = runPhase10UltimateDemo();

    expect(demo.certification.status).toBe("PASS");
    expect(demo.certification.deterministic_execution).toBe(true);
    expect(demo.certification.deterministic_replay).toBe(true);
    expect(demo.certification.evidence_integrity).toBe(true);
    expect(demo.certification.complete_lineage).toBe(true);
    expect(demo.certification.tenant_isolation).toBe(true);
    expect(demo.dashboards).toHaveLength(15);
    expect(demo.ledger).toHaveLength(demo.phases.length);
  });
});
