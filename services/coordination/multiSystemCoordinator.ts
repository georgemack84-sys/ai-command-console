import type { MultiSystemCoordinationRecord } from "../../types/coordination";
import { buildCoordinationAuditRecord } from "./coordinationAudit";
import { validateCoordinationConstraints } from "./coordinationConstraints";
import { buildCoordinationLineage } from "./coordinationLineage";
import { orderCoordinationSystems } from "./coordinationOrdering";
import { evaluateCoordinationPolicies } from "./coordinationPolicies";
import { resolveCoordinationConflict } from "./coordinationResolution";
import { containCoordinationConflict } from "./conflictContainment";
import { buildCoordinationTelemetry } from "./coordinationTelemetry";
import { buildSystemDependencyGraph } from "./systemDependencyGraph";

export function coordinateSystems(input: {
  participatingSystems: string[];
  dependencies: Record<string, string[]>;
  enforcement: {
    executable: boolean;
    enforcementState: string;
    auditRecord: { auditRef: string };
  };
  supervision: {
    supervisionState: string;
    auditRecord: { auditRef: string };
  };
  sovereignty: {
    sovereigntyState: string;
  };
  approvalRequired: boolean;
  approvalVerified: boolean;
  disputedTruthPresent: boolean;
  replayMismatch: boolean;
  raceDetected: boolean;
  timestamp: string;
}) {
  const dependencyOrdering = orderCoordinationSystems(input.participatingSystems);
  const graph = buildSystemDependencyGraph({
    systems: input.participatingSystems,
    dependencies: input.dependencies,
  });
  const conflict = resolveCoordinationConflict({
    disputedTruthPresent: input.disputedTruthPresent,
    containmentRequired: ["CONTAINMENT_ACTIVE", "COLLAPSING", "EMERGENCY_CONTAINMENT"].includes(input.sovereignty.sovereigntyState),
    raceDetected: input.raceDetected,
    replayMismatch: input.replayMismatch,
    approvalBypassAttempted: input.approvalRequired && !input.approvalVerified,
  });
  const containment = containCoordinationConflict({
    conflictState: conflict.conflictState,
    disputedTruthPresent: input.disputedTruthPresent,
    replayMismatch: input.replayMismatch,
  });
  const constraints = validateCoordinationConstraints({
    enforcementExecutable: input.enforcement.executable,
    approvalRequired: input.approvalRequired,
    approvalVerified: input.approvalVerified,
    lineagePresent: input.participatingSystems.length > 0,
    disputedTruthPresent: input.disputedTruthPresent,
  });
  const policy = evaluateCoordinationPolicies({
    enforcementExecutable: input.enforcement.executable,
    containmentRequired: containment.containmentRequired,
    approvalRequired: input.approvalRequired,
    disputedTruthPresent: input.disputedTruthPresent,
    sovereigntyState: input.sovereignty.sovereigntyState,
    supervisionState: input.supervision.supervisionState,
  });

  const coordinationState: MultiSystemCoordinationRecord["coordinationState"] =
    conflict.conflictState === "DISPUTED" ? "DISPUTED"
    : containment.frozen ? "FROZEN"
    : containment.containmentRequired ? "CONTAINED"
    : constraints.allowed === false ? "BLOCKED"
    : policy.outcome === "FREEZE" ? "BLOCKED"
    : policy.outcome === "DENY" ? "BLOCKED"
    : policy.outcome === "REQUIRE_APPROVAL" ? "WARNING"
    : "ACTIVE";

  const coordinationId = `coordination:${input.timestamp}`;
  const lineage = buildCoordinationLineage({
    coordinationId,
    participatingSystems: input.participatingSystems,
    dependencyOrdering,
    enforcementReferences: [input.enforcement.auditRecord.auditRef],
  });

  const record: MultiSystemCoordinationRecord = {
    coordinationId,
    coordinationState,
    participatingSystems: [...input.participatingSystems].sort(),
    coordinationReasoning: [
      ...constraints.blockedReasons,
      `policy:${policy.outcome.toLowerCase()}`,
      `conflict:${conflict.conflictState.toLowerCase()}`,
    ],
    dependencyOrdering,
    containmentRequired: containment.containmentRequired,
    constitutionalSafe: input.enforcement.executable && constraints.allowed,
    approvalRequired: input.approvalRequired,
    enforcementReferences: [input.enforcement.auditRecord.auditRef],
    containmentReferences: containment.containmentRequired ? [`containment:${input.timestamp}`] : [],
    supervisionReferences: [input.supervision.auditRecord.auditRef],
    sovereigntyReferences: [`sovereignty:${input.sovereignty.sovereigntyState}`],
    auditReferences: [`audit:${coordinationId}`],
    immutableLineageHash: lineage.immutableLineageHash,
    timestamp: input.timestamp,
  };

  return {
    record,
    graph,
    auditRecord: buildCoordinationAuditRecord({ coordinationRecord: record }),
    telemetry: buildCoordinationTelemetry({
      coordinationAttempts: 1,
      conflictCount: conflict.conflictState === "NONE" ? 0 : 1,
      frozenCount: coordinationState === "FROZEN" ? 1 : 0,
      containmentRoutingCount: containment.containmentRequired ? 1 : 0,
      replayMismatchCount: input.replayMismatch ? 1 : 0,
      denialCount: constraints.allowed ? 0 : 1,
      approvalRequiredCount: input.approvalRequired ? 1 : 0,
      timestamp: input.timestamp,
    }),
  };
}
