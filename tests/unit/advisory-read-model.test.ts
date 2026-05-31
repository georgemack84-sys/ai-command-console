import { describe, expect, it } from "vitest";

import { aggregateUnifiedAdvisory } from "@/services/advisory";
import { buildAdvisoryReadModel } from "@/services/advisory/advisoryReadModel";

function aggregation() {
  return aggregateUnifiedAdvisory({
    releaseCertification: {
      status: "COMPATIBLE",
      evidenceHash: "sha256:release",
      governanceReplayHash: "sha256:release-replay",
      replayEvidenceAvailable: true,
      authority: "READ_ONLY",
      mayBlockDeployment: false,
      mayTriggerRetry: false,
      mayTriggerRollback: false,
    },
    operationalRules: {
      advisoryStatus: "SAFE",
      evidenceHash: "sha256:operational",
      ruleHash: "sha256:rules",
      evidenceRefs: ["operational-rules:evaluation"],
      replayable: true,
      authority: "ADVISORY_ONLY",
      mayDeploy: false,
      mayRetry: false,
      mayRollback: false,
      mayCancel: false,
      mayResume: false,
      requiresExplicitEnforcementPhase: true,
    },
    deploymentOverrun: {
      advisoryStatus: "NORMAL",
      risk: "LOW",
      evidenceHash: "sha256:overrun",
      advisoryHash: "sha256:overrun-advisory",
      evidenceRefs: ["deployment-overrun:evaluation"],
      replayable: true,
      authority: "ADVISORY_ONLY",
      mayDeploy: false,
      mayRetry: false,
      mayRollback: false,
      mayCancel: false,
      mayResume: false,
      requiresExplicitEnforcementPhase: true,
    },
  });
}

describe("advisory read model", () => {
  it("normalizes aggregation into a read-only model", () => {
    const model = buildAdvisoryReadModel({
      aggregation: aggregation(),
      generatedAt: "2026-05-29T12:00:00.000Z",
    });

    expect(model.unifiedStatus).toBe("NORMAL");
    expect(model.unifiedRisk).toBe("LOW");
    expect(model.authority).toBe("READ_ONLY");
    expect(model.mayDeploy).toBe(false);
    expect(model.mayRetry).toBe(false);
    expect(model.mayRollback).toBe(false);
    expect(model.mayCancel).toBe(false);
    expect(model.mayResume).toBe(false);
    expect(model.mayApprove).toBe(false);
    expect(model.mayOverride).toBe(false);
    expect(model.sourceBreakdown).toHaveLength(3);
  });

  it("hashes snapshots deterministically and excludes generatedAt", () => {
    const first = buildAdvisoryReadModel({
      aggregation: aggregation(),
      generatedAt: "2026-05-29T12:00:00.000Z",
    });
    const second = buildAdvisoryReadModel({
      aggregation: aggregation(),
      generatedAt: "2026-05-29T13:00:00.000Z",
    });

    expect(first.snapshotHash).toBe(second.snapshotHash);
  });

  it("surfaces missing sources and non-replayable sources", () => {
    const model = buildAdvisoryReadModel({
      aggregation: aggregateUnifiedAdvisory({
        releaseCertification: undefined,
        operationalRules: {
          advisoryStatus: "SAFE",
          evidenceHash: "sha256:operational",
          ruleHash: "sha256:rules",
          replayable: false,
          authority: "ADVISORY_ONLY",
          mayDeploy: false,
          mayRetry: false,
          mayRollback: false,
          mayCancel: false,
          mayResume: false,
          requiresExplicitEnforcementPhase: true,
        },
        deploymentOverrun: undefined,
      }),
      generatedAt: "2026-05-29T12:00:00.000Z",
    });

    expect(model.unifiedStatus).toBe("FAILED");
    expect(model.evidenceCompleteness.missing).toBeGreaterThan(0);
    expect(model.replayability.nonReplayableSources).toBeGreaterThan(0);
    expect(model.conflicts.map((conflict) => conflict.reason)).toContain("SOURCE_MISSING");
    expect(model.conflicts.map((conflict) => conflict.reason)).toContain("SOURCE_NOT_REPLAYABLE");
  });
});
