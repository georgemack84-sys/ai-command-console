import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import { classifyObservabilityBoundary, type ObservabilityRouteClass } from "./observabilityBoundary";

export type DiagnosticLineageType = "SNAPSHOT" | "PROBE" | "DIAGNOSTIC";

export type DiagnosticLineageResult = {
  lineageId: string;
  route: string;
  routeClass: ObservabilityRouteClass;
  lineageType: DiagnosticLineageType;
  sourceInputs: string[];
  evidenceRefs: string[];
  correlationId?: string;
  parentLineageIds: string[];
  snapshotId?: string;
  generatedAt: string;
  lineageHash: string;
  reconstructable: boolean;
  authority: "READ_ONLY";
  reasons: string[];
};

type DiagnosticLineageInput = {
  route: string;
  sourceInputs?: string[];
  evidenceRefs?: string[];
  correlationId?: string;
  parentLineageIds?: string[];
  snapshotId?: string;
  generatedAt?: string;
};

function normalizeList(values: string[] | undefined) {
  return Array.from(new Set((values || []).map((value) => value.trim()).filter(Boolean))).sort();
}

function lineageTypeForRouteClass(routeClass: ObservabilityRouteClass): DiagnosticLineageType {
  if (routeClass === "OPERATIONAL_PROBE") {
    return "PROBE";
  }
  if (routeClass === "OBSERVABILITY_SNAPSHOT") {
    return "SNAPSHOT";
  }
  return "DIAGNOSTIC";
}

function buildHashPreimage(input: {
  route: string;
  routeClass: ObservabilityRouteClass;
  lineageType: DiagnosticLineageType;
  sourceInputs: string[];
  evidenceRefs: string[];
  snapshotId?: string;
  parentLineageIds: string[];
  generatedAt: string;
}) {
  return {
    route: input.route,
    routeClass: input.routeClass,
    lineageType: input.lineageType,
    sourceInputs: input.sourceInputs,
    evidenceRefs: input.evidenceRefs,
    snapshotId: input.snapshotId || null,
    parentLineageIds: input.parentLineageIds,
    generatedAt: input.generatedAt,
  };
}

export function buildDiagnosticLineage(input: DiagnosticLineageInput): DiagnosticLineageResult {
  const boundary = classifyObservabilityBoundary(input.route);
  const lineageType = lineageTypeForRouteClass(boundary.routeClass);
  const generatedAt = input.generatedAt || "UNKNOWN";
  const reasons: string[] = [];
  let sourceInputs = normalizeList(input.sourceInputs);
  let evidenceRefs = normalizeList(input.evidenceRefs);
  let parentLineageIds = normalizeList(input.parentLineageIds);
  let snapshotId = input.snapshotId?.trim() || undefined;

  if (lineageType === "PROBE") {
    evidenceRefs = [];
    parentLineageIds = [];
    snapshotId = undefined;
    reasons.push("PROBE_LINEAGE_MINIMAL");
  }

  if (lineageType === "SNAPSHOT") {
    reasons.push("SNAPSHOT_LINEAGE_RECONSTRUCTABLE");
    if (sourceInputs.some((entry) => entry.startsWith("tenant:"))) {
      reasons.push("TENANT_SCOPE_PRESERVED");
    }
  }

  if (lineageType === "DIAGNOSTIC") {
    reasons.push("DIAGNOSTIC_LINEAGE_READ_ONLY");
  }

  if (boundary.reasons.includes("UNKNOWN_ROUTE_FAIL_CLOSED")) {
    reasons.push("UNKNOWN_ROUTE_LINEAGE_FAIL_CLOSED");
  }

  if (!input.generatedAt) {
    reasons.push("GENERATED_AT_MISSING_FAIL_CLOSED");
  }

  const hasRequiredStableTime = generatedAt !== "UNKNOWN";
  const hasKnownRoute = !reasons.includes("UNKNOWN_ROUTE_LINEAGE_FAIL_CLOSED");
  const hasSnapshotInputs = lineageType !== "SNAPSHOT" || (sourceInputs.length > 0 && Boolean(snapshotId));
  const reconstructable = hasRequiredStableTime && hasKnownRoute && hasSnapshotInputs;

  if (!hasSnapshotInputs) {
    reasons.push("SNAPSHOT_LINEAGE_INPUTS_INCOMPLETE");
  }

  const hashPreimage = buildHashPreimage({
    route: boundary.route,
    routeClass: boundary.routeClass,
    lineageType,
    sourceInputs,
    evidenceRefs,
    snapshotId,
    parentLineageIds,
    generatedAt,
  });
  const lineageHash = hashPayloadDeterministically(hashPreimage);

  return {
    lineageId: `lineage:${lineageHash}`,
    route: boundary.route,
    routeClass: boundary.routeClass,
    lineageType,
    sourceInputs,
    evidenceRefs,
    ...(input.correlationId ? { correlationId: input.correlationId } : {}),
    parentLineageIds,
    ...(snapshotId ? { snapshotId } : {}),
    generatedAt,
    lineageHash,
    reconstructable,
    authority: "READ_ONLY",
    reasons,
  };
}
