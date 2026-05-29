import { describe, expect, it } from "vitest";

import { classifyObservabilityBoundary } from "../../services/observability/observabilityBoundary.ts";

const forbiddenProbeFields = [
  "tenantId",
  "snapshotId",
  "lineageHash",
  "diagnosticReport",
  "governanceDecision",
  "deploymentDecision",
  "checkpointStatus",
  "certificateStatus",
  "deploymentRisk",
  "observabilitySnapshot",
] as const;

describe("observability boundary enforcement", () => {
  it.each(["/api/health", "/api/ready"])("%s remains a non-tenant operational probe", (route) => {
    const boundary = classifyObservabilityBoundary(route);

    expect(boundary).toMatchObject({
      route,
      routeClass: "OPERATIONAL_PROBE",
      authority: "READINESS_SIGNAL",
      tenantScoped: false,
      mutating: false,
      mayBlockDeployment: false,
      mayTriggerRecovery: false,
      mayCreateSnapshot: false,
    });
    expect(boundary.reasons).toContain("OPERATIONAL_PROBE_READINESS_SIGNAL");
  });

  it("keeps observability health as a tenant-scoped diagnostic snapshot", () => {
    const boundary = classifyObservabilityBoundary("/api/v1/observability/health");

    expect(boundary).toMatchObject({
      route: "/api/v1/observability/health",
      routeClass: "OBSERVABILITY_SNAPSHOT",
      authority: "DIAGNOSTIC_VISIBILITY",
      tenantScoped: true,
      mutating: false,
      mayBlockDeployment: false,
      mayTriggerRecovery: false,
      mayCreateSnapshot: true,
    });
    expect(boundary.reasons).toContain("TENANT_SCOPED_OBSERVABILITY_SNAPSHOT");
  });

  it.each(["/api/v1/observability/diagnostics", "/api/v1/observability/timeline"])("%s remains a read-only diagnostic report", (route) => {
    const boundary = classifyObservabilityBoundary(route);

    expect(boundary).toMatchObject({
      route,
      routeClass: "DIAGNOSTIC_REPORT",
      authority: "FORENSIC_CONTEXT",
      tenantScoped: true,
      mutating: false,
      mayBlockDeployment: false,
      mayTriggerRecovery: false,
      mayCreateSnapshot: false,
    });
    expect(boundary.reasons).toContain("DIAGNOSTIC_REPORT_READ_ONLY");
  });

  it("classifies routes deterministically", () => {
    const first = classifyObservabilityBoundary("/api/v1/observability/health");
    const second = classifyObservabilityBoundary("/api/v1/observability/health");

    expect(second).toEqual(first);
  });

  it("fails closed for unknown routes without deployment, recovery, or mutation authority", () => {
    const boundary = classifyObservabilityBoundary("/api/v1/observability/unknown");

    expect(boundary).toMatchObject({
      route: "/api/v1/observability/unknown",
      routeClass: "DIAGNOSTIC_REPORT",
      authority: "FORENSIC_CONTEXT",
      tenantScoped: false,
      mutating: false,
      mayBlockDeployment: false,
      mayTriggerRecovery: false,
      mayCreateSnapshot: false,
    });
    expect(boundary.reasons).toContain("UNKNOWN_ROUTE_FAIL_CLOSED");
  });

  it("never grants deployment or recovery authority to any classified boundary", () => {
    const routes = [
      "/api/health",
      "/api/ready",
      "/api/v1/observability/health",
      "/api/v1/observability/diagnostics",
      "/api/v1/observability/timeline",
      "/api/v1/observability/unknown",
    ];

    for (const route of routes) {
      const boundary = classifyObservabilityBoundary(route);

      expect(boundary.mutating).toBe(false);
      expect(boundary.mayBlockDeployment).toBe(false);
      expect(boundary.mayTriggerRecovery).toBe(false);
    }
  });

  it("documents fields operational probes must not expose", () => {
    expect(forbiddenProbeFields).toEqual([
      "tenantId",
      "snapshotId",
      "lineageHash",
      "diagnosticReport",
      "governanceDecision",
      "deploymentDecision",
      "checkpointStatus",
      "certificateStatus",
      "deploymentRisk",
      "observabilitySnapshot",
    ]);
  });
});
