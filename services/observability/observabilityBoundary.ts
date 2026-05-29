export type ObservabilityRouteClass = "OPERATIONAL_PROBE" | "OBSERVABILITY_SNAPSHOT" | "DIAGNOSTIC_REPORT";

export type BoundaryAuthority = "READINESS_SIGNAL" | "DIAGNOSTIC_VISIBILITY" | "FORENSIC_CONTEXT";

export type ObservabilityBoundaryResult = {
  route: string;
  routeClass: ObservabilityRouteClass;
  authority: BoundaryAuthority;
  tenantScoped: boolean;
  mutating: false;
  mayBlockDeployment: false;
  mayTriggerRecovery: false;
  mayCreateSnapshot: boolean;
  reasons: string[];
};

const OPERATIONAL_PROBES = new Set(["/api/health", "/api/ready"]);
const DIAGNOSTIC_REPORTS = new Set(["/api/v1/observability/diagnostics", "/api/v1/observability/timeline"]);

function normalizeRoute(route: string) {
  const [path] = route.trim().split("?");
  return path.replace(/\/+$/, "") || "/";
}

function boundaryResult(input: Omit<ObservabilityBoundaryResult, "mutating" | "mayBlockDeployment" | "mayTriggerRecovery">): ObservabilityBoundaryResult {
  return {
    ...input,
    mutating: false,
    mayBlockDeployment: false,
    mayTriggerRecovery: false,
  };
}

export function classifyObservabilityBoundary(route: string): ObservabilityBoundaryResult {
  const normalizedRoute = normalizeRoute(route);

  if (OPERATIONAL_PROBES.has(normalizedRoute)) {
    return boundaryResult({
      route: normalizedRoute,
      routeClass: "OPERATIONAL_PROBE",
      authority: "READINESS_SIGNAL",
      tenantScoped: false,
      mayCreateSnapshot: false,
      reasons: ["OPERATIONAL_PROBE_READINESS_SIGNAL", "NO_OBSERVABILITY_SNAPSHOT_PAYLOAD"],
    });
  }

  if (normalizedRoute === "/api/v1/observability/health") {
    return boundaryResult({
      route: normalizedRoute,
      routeClass: "OBSERVABILITY_SNAPSHOT",
      authority: "DIAGNOSTIC_VISIBILITY",
      tenantScoped: true,
      mayCreateSnapshot: true,
      reasons: ["TENANT_SCOPED_OBSERVABILITY_SNAPSHOT", "NOT_A_READINESS_PROBE"],
    });
  }

  if (DIAGNOSTIC_REPORTS.has(normalizedRoute)) {
    return boundaryResult({
      route: normalizedRoute,
      routeClass: "DIAGNOSTIC_REPORT",
      authority: "FORENSIC_CONTEXT",
      tenantScoped: true,
      mayCreateSnapshot: false,
      reasons: ["DIAGNOSTIC_REPORT_READ_ONLY", "NON_DEPLOYMENT_AUTHORITATIVE"],
    });
  }

  return boundaryResult({
    route: normalizedRoute,
    routeClass: "DIAGNOSTIC_REPORT",
    authority: "FORENSIC_CONTEXT",
    tenantScoped: false,
    mayCreateSnapshot: false,
    reasons: ["UNKNOWN_ROUTE_FAIL_CLOSED", "NO_DEPLOYMENT_AUTHORITY", "NO_RECOVERY_AUTHORITY", "NO_MUTATION_AUTHORITY"],
  });
}
