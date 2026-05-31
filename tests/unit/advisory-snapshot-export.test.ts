import { describe, expect, it } from "vitest";

import { aggregateUnifiedAdvisory } from "@/services/advisory";
import { buildAdvisoryReadModel, type AdvisoryReadModel } from "@/services/advisory/advisoryReadModel";
import { buildAdvisorySnapshotExport } from "@/services/advisory/advisorySnapshotExport";

function readModel(overrides: Partial<AdvisoryReadModel> = {}) {
  const aggregation = aggregateUnifiedAdvisory({
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

  return {
    ...buildAdvisoryReadModel({
      aggregation,
      generatedAt: "2026-05-29T12:00:00.000Z",
    }),
    ...overrides,
  } as AdvisoryReadModel;
}

describe("advisory snapshot export", () => {
  it("exports deterministic read-only snapshots", () => {
    const first = buildAdvisorySnapshotExport(readModel(), "2026-05-29T12:00:00.000Z");
    const second = buildAdvisorySnapshotExport(readModel(), "2026-05-29T13:00:00.000Z");

    expect(first.exportStatus).toBe("EXPORTED");
    expect(first.snapshotHash).toBe(second.snapshotHash);
    expect(first.snapshotId).toBe(second.snapshotId);
    expect(first.generatedAt).not.toBe(second.generatedAt);
    expect(first.authority).toBe("READ_ONLY");
    expect(first.mayDeploy).toBe(false);
    expect(first.mayRetry).toBe(false);
    expect(first.mayRollback).toBe(false);
    expect(first.mayCancel).toBe(false);
    expect(first.mayResume).toBe(false);
    expect(first.mayApprove).toBe(false);
    expect(first.mayOverride).toBe(false);
  });

  it("fails safely when the read model is missing", () => {
    const exported = buildAdvisorySnapshotExport(undefined, "2026-05-29T12:00:00.000Z");

    expect(exported.exportStatus).toBe("FAILED_EXPORT");
    expect(exported.authority).toBe("READ_ONLY");
    expect(exported.mayDeploy).toBe(false);
    expect(exported.reasons).toContain("READ_MODEL_MISSING");
  });

  it("disputes unknown status and risk values", () => {
    const unknownStatus = buildAdvisorySnapshotExport(
      readModel({ unifiedStatus: "STRANGE" as AdvisoryReadModel["unifiedStatus"] }),
      "2026-05-29T12:00:00.000Z",
    );
    const unknownRisk = buildAdvisorySnapshotExport(
      readModel({ unifiedRisk: "WILD" as AdvisoryReadModel["unifiedRisk"] }),
      "2026-05-29T12:00:00.000Z",
    );

    expect(unknownStatus.exportStatus).toBe("DISPUTED_EXPORT");
    expect(unknownStatus.reasons).toContain("UNKNOWN_STATUS:STRANGE");
    expect(unknownRisk.exportStatus).toBe("DISPUTED_EXPORT");
    expect(unknownRisk.reasons).toContain("UNKNOWN_RISK:WILD");
  });

  it("disputes authority leaks and mayDeploy controls", () => {
    const authorityLeak = buildAdvisorySnapshotExport(
      readModel({ authority: "CONTROL" as AdvisoryReadModel["authority"] }),
      "2026-05-29T12:00:00.000Z",
    );
    const controlLeak = buildAdvisorySnapshotExport(
      readModel({ mayDeploy: true as AdvisoryReadModel["mayDeploy"] }),
      "2026-05-29T12:00:00.000Z",
    );

    expect(authorityLeak.exportStatus).toBe("DISPUTED_EXPORT");
    expect(authorityLeak.authority).toBe("READ_ONLY");
    expect(authorityLeak.reasons).toContain("AUTHORITY_NOT_READ_ONLY");
    expect(controlLeak.exportStatus).toBe("DISPUTED_EXPORT");
    expect(controlLeak.mayDeploy).toBe(false);
    expect(controlLeak.reasons).toContain("CONTROL_AUTHORITY_LEAK:mayDeploy");
  });

  it("does not mutate input and normalizes source and conflict ordering", () => {
    const model = readModel({
      sourceBreakdown: [
        { source: "Z", status: "NORMAL", replayable: true, evidenceAvailable: true, present: true },
        { source: "A", status: "NORMAL", replayable: true, evidenceAvailable: true, present: true },
      ],
      conflicts: [
        { source: "Z", reason: "Z_REASON" },
        { source: "A", reason: "A_REASON" },
      ],
    });
    const sourceOrder = model.sourceBreakdown.map((source) => source.source);
    const conflictOrder = model.conflicts.map((conflict) => conflict.source);

    const first = buildAdvisorySnapshotExport(model, "2026-05-29T12:00:00.000Z");
    const second = buildAdvisorySnapshotExport(
      readModel({
        sourceBreakdown: [...model.sourceBreakdown].reverse(),
        conflicts: [...model.conflicts].reverse(),
      }),
      "2026-05-29T12:00:00.000Z",
    );

    expect(model.sourceBreakdown.map((source) => source.source)).toEqual(sourceOrder);
    expect(model.conflicts.map((conflict) => conflict.source)).toEqual(conflictOrder);
    expect(first.sourceBreakdown.map((source) => (source as { source: string }).source)).toEqual(["A", "Z"]);
    expect(first.conflicts.map((conflict) => (conflict as { source: string }).source)).toEqual(["A", "Z"]);
    expect(first.snapshotHash).toBe(second.snapshotHash);
  });
});
