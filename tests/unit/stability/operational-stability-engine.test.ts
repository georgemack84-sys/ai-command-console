import { describe, expect, it } from "vitest";

import { assessOperationalStability } from "@/services/stability/operationalStabilityEngine";

describe("assessOperationalStability", () => {
  it("produces a stable assessment for healthy inputs", () => {
    const result = assessOperationalStability({
      stewardshipState: "VERIFIED",
      stewardshipSignals: {
        freezeRequired: false,
        containmentRequired: false,
        escalationRequired: false,
        disputed: false,
      },
      survivabilityForecast: {
        collapseRisk: 0.05,
        survivabilityScore: 0.94,
        confidence: 0.92,
      },
      continuity: {
        continuityConfidence: 0.95,
        staleExecutions: 0,
        degradedDependencies: [],
        activeRecoveries: 0,
      },
      replay: {
        divergenceCount: 0,
        divergenceSeverity: 0,
      },
      recovery: {
        activeRecoveries: 0,
        failedRecoveries: 0,
        successfulRecoveries: 4,
        repeatedFailures: 0,
      },
      escalation: {
        escalationCount: 0,
        unresolvedEscalations: 0,
      },
      operator: {
        interventionCount: 0,
      },
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.operationalState).toBe("STABLE");
  });

  it("lowers survivability on disputed stewardship", () => {
    const result = assessOperationalStability({
      stewardshipState: "DISPUTED",
      stewardshipSignals: { disputed: true },
      continuity: { continuityConfidence: 0.7 },
    });

    expect(result.disputed).toBe(true);
    expect(result.operationalState).toBe("DISPUTED");
    expect(result.survivabilityScore).toBeLessThan(0.6);
  });

  it("fails cautious on missing inputs", () => {
    const result = assessOperationalStability({});
    expect(result.survivabilityScore).toBeLessThan(0.6);
    expect(result.operationalState).not.toBe("STABLE");
  });

  it("increases degradation with replay divergence and stale executions", () => {
    const result = assessOperationalStability({
      replay: { divergenceCount: 2, divergenceSeverity: 0.8 },
      continuity: { staleExecutions: 4, degradedDependencies: ["workers"] },
    });

    expect(result.degradationRate).toBeGreaterThan(0.4);
  });

  it("raises escalation pressure on unresolved escalations", () => {
    const result = assessOperationalStability({
      escalation: { escalationCount: 1, unresolvedEscalations: 2 },
    });
    expect(result.escalationPressure).toBeGreaterThan(0.4);
  });

  it("raises recovery pressure on repeated failures", () => {
    const result = assessOperationalStability({
      recovery: { activeRecoveries: 2, failedRecoveries: 2, repeatedFailures: 2 },
    });
    expect(result.recoveryPressure).toBeGreaterThan(0.6);
  });

  it("recommends lockdown under catastrophic pressure", () => {
    const result = assessOperationalStability({
      stewardshipSignals: { containmentRequired: true, freezeRequired: true, disputed: true },
      survivabilityForecast: { collapseRisk: 0.95, confidence: 0.1 },
      replay: { divergenceCount: 4, divergenceSeverity: 1 },
      recovery: { failedRecoveries: 4, repeatedFailures: 4 },
      escalation: { unresolvedEscalations: 4 },
      continuity: { continuityConfidence: 0.12, staleExecutions: 5, degradedDependencies: ["db", "queue", "workers"] },
    });

    expect(result.lockdownRecommended).toBe(true);
  });

  it("does not execute recovery or replay as a side effect", () => {
    const result = assessOperationalStability({
      stewardshipSignals: { freezeRequired: true },
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.timestamp).toBe("2026-05-09T00:00:00.000Z");
  });
});
