import { describe, expect, it } from "vitest";

import { classifyObservabilityBoundary } from "../../services/observability/observabilityBoundary.ts";
import { buildDiagnosticLineage } from "../../services/observability/diagnosticLineage.ts";

describe("diagnostic lineage", () => {
  it("produces deterministic lineage IDs and hashes from stable inputs", () => {
    const input = {
      route: "/api/v1/observability/health",
      generatedAt: "2026-05-29T00:00:00.000Z",
      snapshotId: "snapshot-1",
      sourceInputs: ["metrics:contracts", "tenant:workspace-1"],
      evidenceRefs: ["contract:api.v1.observability.health.response"],
      parentLineageIds: ["lineage-parent-2", "lineage-parent-1"],
    };

    const first = buildDiagnosticLineage(input);
    const second = buildDiagnosticLineage(input);

    expect(second.lineageId).toBe(first.lineageId);
    expect(second.lineageHash).toBe(first.lineageHash);
    expect(first.lineageHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("builds reconstructable snapshot lineage for observability health", () => {
    const lineage = buildDiagnosticLineage({
      route: "/api/v1/observability/health",
      generatedAt: "2026-05-29T00:00:00.000Z",
      snapshotId: "snapshot-1",
      sourceInputs: ["tenant:workspace-1", "metricSnapshot:snapshot-1"],
      evidenceRefs: ["contract:api.v1.observability.health.response"],
    });

    expect(lineage).toMatchObject({
      route: "/api/v1/observability/health",
      routeClass: "OBSERVABILITY_SNAPSHOT",
      lineageType: "SNAPSHOT",
      snapshotId: "snapshot-1",
      reconstructable: true,
      authority: "READ_ONLY",
    });
    expect(lineage.sourceInputs).toEqual(["metricSnapshot:snapshot-1", "tenant:workspace-1"]);
    expect(lineage.reasons).toContain("SNAPSHOT_LINEAGE_RECONSTRUCTABLE");
    expect(lineage.reasons).toContain("TENANT_SCOPE_PRESERVED");
  });

  it("keeps probe lineage minimal and non-snapshot", () => {
    const lineage = buildDiagnosticLineage({
      route: "/api/ready",
      generatedAt: "2026-05-29T00:00:00.000Z",
      sourceInputs: ["runtimePosture", "databaseHealth"],
      evidenceRefs: ["startup:readiness"],
      snapshotId: "must-not-be-kept",
    });

    expect(lineage).toMatchObject({
      route: "/api/ready",
      routeClass: "OPERATIONAL_PROBE",
      lineageType: "PROBE",
      reconstructable: true,
      authority: "READ_ONLY",
    });
    expect(lineage.snapshotId).toBeUndefined();
    expect(lineage.sourceInputs).toEqual(["databaseHealth", "runtimePosture"]);
    expect(lineage.evidenceRefs).toEqual([]);
    expect(lineage.parentLineageIds).toEqual([]);
    expect(lineage.reasons).toContain("PROBE_LINEAGE_MINIMAL");
  });

  it("builds read-only diagnostic lineage with normalized parent lineage IDs", () => {
    const lineage = buildDiagnosticLineage({
      route: "/api/v1/observability/diagnostics",
      generatedAt: "2026-05-29T00:00:00.000Z",
      sourceInputs: ["diagnostic:health", "diagnostic:metrics"],
      evidenceRefs: ["snapshot:snapshot-1"],
      parentLineageIds: ["lineage-b", "lineage-a", "lineage-a"],
    });

    expect(lineage).toMatchObject({
      route: "/api/v1/observability/diagnostics",
      routeClass: "DIAGNOSTIC_REPORT",
      lineageType: "DIAGNOSTIC",
      reconstructable: true,
      authority: "READ_ONLY",
    });
    expect(lineage.parentLineageIds).toEqual(["lineage-a", "lineage-b"]);
    expect(lineage.reasons).toContain("DIAGNOSTIC_LINEAGE_READ_ONLY");
  });

  it("fails closed for unknown lineage inputs without changing authority", () => {
    const lineage = buildDiagnosticLineage({
      route: "/api/v1/observability/unknown",
      generatedAt: "2026-05-29T00:00:00.000Z",
      sourceInputs: [],
      evidenceRefs: [],
    });

    expect(lineage).toMatchObject({
      route: "/api/v1/observability/unknown",
      routeClass: "DIAGNOSTIC_REPORT",
      lineageType: "DIAGNOSTIC",
      reconstructable: false,
      authority: "READ_ONLY",
    });
    expect(lineage.reasons).toContain("UNKNOWN_ROUTE_LINEAGE_FAIL_CLOSED");
  });

  it("marks lineage unreconstructable when generatedAt is missing instead of using wall-clock time", () => {
    const lineage = buildDiagnosticLineage({
      route: "/api/v1/observability/health",
      snapshotId: "snapshot-1",
      sourceInputs: ["metricSnapshot:snapshot-1"],
      evidenceRefs: ["contract:api.v1.observability.health.response"],
    });

    expect(lineage.generatedAt).toBe("UNKNOWN");
    expect(lineage.reconstructable).toBe(false);
    expect(lineage.reasons).toContain("GENERATED_AT_MISSING_FAIL_CLOSED");
  });

  it("does not include correlation IDs in lineage hashes", () => {
    const base = {
      route: "/api/v1/observability/health",
      generatedAt: "2026-05-29T00:00:00.000Z",
      snapshotId: "snapshot-1",
      sourceInputs: ["metricSnapshot:snapshot-1"],
      evidenceRefs: ["contract:api.v1.observability.health.response"],
    };

    const first = buildDiagnosticLineage({ ...base, correlationId: "correlation-a" });
    const second = buildDiagnosticLineage({ ...base, correlationId: "correlation-b" });

    expect(second.lineageHash).toBe(first.lineageHash);
    expect(second.lineageId).toBe(first.lineageId);
    expect(second.correlationId).toBe("correlation-b");
  });

  it("preserves 3.7A route boundary classifications", () => {
    const boundary = classifyObservabilityBoundary("/api/v1/observability/health");
    const lineage = buildDiagnosticLineage({
      route: "/api/v1/observability/health",
      generatedAt: "2026-05-29T00:00:00.000Z",
      snapshotId: "snapshot-1",
      sourceInputs: ["metricSnapshot:snapshot-1"],
      evidenceRefs: ["contract:api.v1.observability.health.response"],
    });

    expect(lineage.routeClass).toBe(boundary.routeClass);
    expect(lineage.authority).toBe("READ_ONLY");
  });
});
