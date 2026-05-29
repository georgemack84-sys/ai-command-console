import { describe, expect, it } from "vitest";

import { buildDiagnosticLineage } from "../../services/observability/diagnosticLineage.ts";
import { replayObservabilityLineage } from "../../services/observability/observabilityReplay.ts";
import { classifyObservabilityBoundary } from "../../services/observability/observabilityBoundary.ts";

function snapshotLineage() {
  return buildDiagnosticLineage({
    route: "/api/v1/observability/health",
    generatedAt: "2026-05-29T00:00:00.000Z",
    snapshotId: "snapshot-1",
    sourceInputs: ["metricSnapshot:snapshot-1", "tenant:workspace-1"],
    evidenceRefs: ["contract:api.v1.observability.health.response", "snapshot:snapshot-1"],
    parentLineageIds: ["lineage-parent-1"],
    correlationId: "correlation-a",
  });
}

describe("observability replay", () => {
  it("replays probe lineage deterministically with read-only authority", () => {
    const lineage = buildDiagnosticLineage({
      route: "/api/health",
      generatedAt: "2026-05-29T00:00:00.000Z",
      sourceInputs: ["databaseHealth", "runtimePosture"],
    });

    const first = replayObservabilityLineage({
      lineage,
      reconstructedAt: "2026-05-29T01:00:00.000Z",
      availableEvidenceRefs: [],
    });
    const second = replayObservabilityLineage({
      lineage,
      reconstructedAt: "2026-05-29T02:00:00.000Z",
      availableEvidenceRefs: [],
    });

    expect(second.replayHash).toBe(first.replayHash);
    expect(second.replayId).toBe(first.replayId);
    expect(first).toMatchObject({
      replayTarget: "PROBE",
      replayStatus: "CONSISTENT",
      completenessScore: 1,
      reconstructable: true,
      authority: "READ_ONLY",
    });
  });

  it("replays snapshot lineage deterministically and preserves tenant scope", () => {
    const lineage = snapshotLineage();
    const replay = replayObservabilityLineage({
      lineage,
      reconstructedAt: "2026-05-29T01:00:00.000Z",
      availableEvidenceRefs: ["contract:api.v1.observability.health.response", "snapshot:snapshot-1"],
    });

    expect(replay).toMatchObject({
      replayTarget: "SNAPSHOT",
      sourceLineageHash: lineage.lineageHash,
      reconstructedLineageHash: lineage.lineageHash,
      replayStatus: "CONSISTENT",
      completenessScore: 1,
      reconstructable: true,
      authority: "READ_ONLY",
    });
    expect(replay.replayInputs).toEqual(["metricSnapshot:snapshot-1", "tenant:workspace-1"]);
    expect(replay.reasons).toContain("TENANT_SCOPE_PRESERVED");
  });

  it("replays diagnostic lineage deterministically with parent ancestry", () => {
    const lineage = buildDiagnosticLineage({
      route: "/api/v1/observability/diagnostics",
      generatedAt: "2026-05-29T00:00:00.000Z",
      sourceInputs: ["diagnostic:health", "diagnostic:metrics"],
      evidenceRefs: ["snapshot:snapshot-1"],
      parentLineageIds: ["lineage-b", "lineage-a"],
    });

    const replay = replayObservabilityLineage({
      lineage,
      reconstructedAt: "2026-05-29T01:00:00.000Z",
      availableEvidenceRefs: ["snapshot:snapshot-1"],
    });

    expect(replay).toMatchObject({
      replayTarget: "DIAGNOSTIC",
      replayStatus: "CONSISTENT",
      completenessScore: 1,
      reconstructable: true,
      authority: "READ_ONLY",
    });
    expect(replay.replayHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("fails safely for invalid lineage", () => {
    const lineage = buildDiagnosticLineage({
      route: "/api/v1/observability/unknown",
      generatedAt: "2026-05-29T00:00:00.000Z",
      sourceInputs: [],
      evidenceRefs: [],
    });

    const replay = replayObservabilityLineage({
      lineage,
      reconstructedAt: "2026-05-29T01:00:00.000Z",
      availableEvidenceRefs: [],
    });

    expect(replay).toMatchObject({
      replayTarget: "DIAGNOSTIC",
      replayStatus: "FAILED",
      completenessScore: 0,
      reconstructable: false,
      authority: "READ_ONLY",
    });
    expect(replay.reasons).toContain("LINEAGE_NOT_RECONSTRUCTABLE_FAIL_SAFE");
  });

  it("lowers completeness for missing optional evidence and returns PARTIAL", () => {
    const lineage = buildDiagnosticLineage({
      route: "/api/v1/observability/diagnostics",
      generatedAt: "2026-05-29T00:00:00.000Z",
      sourceInputs: ["diagnostic:health"],
      evidenceRefs: ["snapshot:snapshot-1", "optional:timeline"],
    });

    const replay = replayObservabilityLineage({
      lineage,
      reconstructedAt: "2026-05-29T01:00:00.000Z",
      availableEvidenceRefs: ["snapshot:snapshot-1"],
      optionalEvidenceRefs: ["optional:timeline"],
    });

    expect(replay.replayStatus).toBe("PARTIAL");
    expect(replay.completenessScore).toBeGreaterThan(0);
    expect(replay.completenessScore).toBeLessThan(1);
    expect(replay.reconstructable).toBe(true);
  });

  it("returns FAILED when critical evidence is missing", () => {
    const lineage = snapshotLineage();
    const replay = replayObservabilityLineage({
      lineage,
      reconstructedAt: "2026-05-29T01:00:00.000Z",
      availableEvidenceRefs: ["snapshot:snapshot-1"],
    });

    expect(replay.replayStatus).toBe("FAILED");
    expect(replay.completenessScore).toBeLessThan(0.5);
    expect(replay.driftReasons).toContainEqual(expect.objectContaining({
      category: "missing_critical_evidence",
      severity: "HIGH",
    }));
  });

  it("returns DRIFTED when reconstructed lineage hash differs", () => {
    const lineage = snapshotLineage();
    const replay = replayObservabilityLineage({
      lineage,
      reconstructedAt: "2026-05-29T01:00:00.000Z",
      availableEvidenceRefs: ["contract:api.v1.observability.health.response", "snapshot:snapshot-1"],
      reconstructedLineageHash: "drifted-lineage-hash",
    });

    expect(replay.replayStatus).toBe("DRIFTED");
    expect(replay.reconstructable).toBe(true);
    expect(replay.driftReasons).toContainEqual(expect.objectContaining({
      category: "lineage_mismatch",
      expected: lineage.lineageHash,
      actual: "drifted-lineage-hash",
      severity: "HIGH",
    }));
  });

  it("keeps drift reasons deterministic", () => {
    const lineage = snapshotLineage();
    const first = replayObservabilityLineage({
      lineage,
      reconstructedAt: "2026-05-29T01:00:00.000Z",
      availableEvidenceRefs: ["snapshot:snapshot-1"],
      reconstructedLineageHash: "drifted-lineage-hash",
    });
    const second = replayObservabilityLineage({
      lineage,
      reconstructedAt: "2026-05-29T02:00:00.000Z",
      availableEvidenceRefs: ["snapshot:snapshot-1"],
      reconstructedLineageHash: "drifted-lineage-hash",
    });

    expect(second.driftReasons).toEqual(first.driftReasons);
    expect(second.replayHash).toBe(first.replayHash);
  });

  it("ignores correlation IDs when computing replay hashes", () => {
    const base = {
      route: "/api/v1/observability/health",
      generatedAt: "2026-05-29T00:00:00.000Z",
      snapshotId: "snapshot-1",
      sourceInputs: ["metricSnapshot:snapshot-1", "tenant:workspace-1"],
      evidenceRefs: ["contract:api.v1.observability.health.response", "snapshot:snapshot-1"],
    };
    const first = buildDiagnosticLineage({ ...base, correlationId: "correlation-a" });
    const second = buildDiagnosticLineage({ ...base, correlationId: "correlation-b" });

    const firstReplay = replayObservabilityLineage({
      lineage: first,
      reconstructedAt: "2026-05-29T01:00:00.000Z",
      availableEvidenceRefs: ["contract:api.v1.observability.health.response", "snapshot:snapshot-1"],
    });
    const secondReplay = replayObservabilityLineage({
      lineage: second,
      reconstructedAt: "2026-05-29T02:00:00.000Z",
      availableEvidenceRefs: ["contract:api.v1.observability.health.response", "snapshot:snapshot-1"],
    });

    expect(secondReplay.replayHash).toBe(firstReplay.replayHash);
  });

  it("preserves 3.7A boundary classifications and 3.7B lineage behavior", () => {
    const boundary = classifyObservabilityBoundary("/api/v1/observability/health");
    const lineage = snapshotLineage();
    const replay = replayObservabilityLineage({
      lineage,
      reconstructedAt: "2026-05-29T01:00:00.000Z",
      availableEvidenceRefs: ["contract:api.v1.observability.health.response", "snapshot:snapshot-1"],
    });

    expect(lineage.routeClass).toBe(boundary.routeClass);
    expect(lineage.authority).toBe("READ_ONLY");
    expect(replay.authority).toBe("READ_ONLY");
  });
});
