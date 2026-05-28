import type {
  BoundaryLineageEntry,
  CoordinationBoundaryAuthorityContract,
  CoordinationBoundaryError,
  CoordinationBoundaryInput,
  CoordinationBoundaryResult,
} from "@/types/coordination-boundary-enforcement";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";
import { detectHiddenExecution } from "./hiddenExecutionDetector";
import { detectOrchestrationDrift } from "./orchestrationDriftDetector";
import { detectRecursiveWorkflow } from "./recursiveWorkflowDetector";
import { validateGovernanceSupremacy } from "./governanceSupremacyValidator";
import { validateBoundaryConsistency } from "./boundaryConsistencyValidator";
import { resolveBoundaryState, resolveBoundaryVerdict } from "./boundaryFreezeCoordinator";
import { inspectOrchestrationBoundary } from "@/services/boundary-visibility/orchestrationBoundaryInspector";
import { inspectRecursiveWorkflow } from "@/services/boundary-visibility/recursiveWorkflowInspector";
import { inspectBoundaryViolations } from "@/services/boundary-visibility/boundaryViolationInspector";
import { buildBoundaryEvidence } from "./boundaryEvidenceBuilder";
import { appendBoundaryReplayLedger } from "@/services/boundary-lineage/boundaryReplayLedger";
import { appendBoundaryLineage } from "@/services/boundary-lineage/boundaryLineageEngine";

function error(
  code: CoordinationBoundaryError["code"],
  message: string,
  path?: string,
): CoordinationBoundaryError {
  return Object.freeze({ code, message, path });
}

function buildAuthorityContract(): CoordinationBoundaryAuthorityContract {
  return Object.freeze({
    executionAuthority: false,
    orchestrationAuthority: false,
    schedulingAuthority: false,
    runtimeMutationAuthority: false,
    governanceMutationAuthority: false,
    approvalInheritance: false,
    authorityInheritance: false,
    autonomousIntervention: false,
    workflowContinuation: false,
  });
}

export function buildCoordinationBoundaryEnforcement(
  input: CoordinationBoundaryInput,
): CoordinationBoundaryResult {
  const authorityContract = buildAuthorityContract();
  const hiddenExecution = detectHiddenExecution(input);
  const drift = detectOrchestrationDrift(input);
  const recursive = detectRecursiveWorkflow(input);
  const governance = validateGovernanceSupremacy(input);
  const consistency = validateBoundaryConsistency(input);

  const metadata = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const authorityExpansionErrors = metadata.includes("authorityinheritance") || metadata.includes("dynamiccapability")
    ? Object.freeze([
      error(
        "COORDINATION_BOUNDARY_AUTHORITY_EXPANSION",
        "Authority inheritance or dynamic capability acquisition markers were detected.",
        "metadata",
      ),
    ])
    : Object.freeze([] as CoordinationBoundaryError[]);

  const allErrors = Object.freeze([
    ...hiddenExecution.errors,
    ...drift.errors,
    ...recursive.errors,
    ...governance.errors,
    ...consistency.errors,
    ...authorityExpansionErrors,
  ]);

  const failClosed = allErrors.some((item) =>
    item.code.includes("FAIL_CLOSED")
    || item.code.includes("REPLAY")
    || item.code.includes("GOVERNANCE")
    || item.code.includes("CONTAINMENT_BYPASS"));

  const verdict = resolveBoundaryVerdict({
    hasExecution: hiddenExecution.errors.some((item) => item.code === "COORDINATION_BOUNDARY_EXECUTION_SEMANTICS"),
    hasRecursive: recursive.errors.length > 0,
    hasScheduling: hiddenExecution.errors.some((item) => item.code === "COORDINATION_BOUNDARY_HIDDEN_SCHEDULING"),
    hasAuthorityExpansion: authorityExpansionErrors.length > 0,
    hasReplayBreak: consistency.errors.some((item) => item.code === "COORDINATION_BOUNDARY_REPLAY_LINEAGE_BREAK"),
    hasGovernanceGap: governance.errors.length > 0,
    hasDrift: drift.errors.length > 0,
    failClosed,
  });

  const boundaryState = resolveBoundaryState({
    verdict,
    inheritedContainment: input.orchestrationRecord.containment.inheritedState,
  });

  const violations = Object.freeze([
    ...hiddenExecution.violations,
    ...drift.violations,
    ...recursive.violations,
    ...governance.violations,
    ...consistency.violations,
    ...(authorityExpansionErrors.length > 0
      ? [Object.freeze({
        violationId: hashCoordinationReplayValue("boundary-authority-expansion-id", {
          coordinationId: input.coordinationRecord.coordinationId,
          createdAt: input.createdAt,
        }),
        coordinationId: input.coordinationRecord.coordinationId,
        violationType: "AUTHORITY_EXPANSION" as const,
        severity: "critical" as const,
        governanceLinked: true,
        replaySafe: true,
        createdAt: input.createdAt,
        deterministicHash: hashCoordinationReplayValue("boundary-authority-expansion", metadata),
      })]
      : []),
  ]);

  const orchestrationInspection = inspectOrchestrationBoundary(input.orchestrationRecord);
  const recursiveInspection = inspectRecursiveWorkflow({
    coordinationId: input.coordinationRecord.coordinationId,
    recursive: recursive.recursive,
    indicators: recursive.indicators,
  });
  const violationInspection = inspectBoundaryViolations({
    coordinationId: input.coordinationRecord.coordinationId,
    verdict,
    violations,
  });

  const evidence = buildBoundaryEvidence({
    boundaryInput: input,
    orchestrationInspection,
    recursiveInspection,
    violationCodes: allErrors.map((item) => item.code),
  });

  const lineageEntry: BoundaryLineageEntry = Object.freeze({
    entryId: hashCoordinationReplayValue("coordination-boundary-lineage-entry-id", {
      boundaryId: input.boundaryId,
      coordinationId: input.coordinationRecord.coordinationId,
      createdAt: input.createdAt,
    }),
    boundaryId: input.boundaryId,
    coordinationId: input.coordinationRecord.coordinationId,
    verdict,
    boundaryState,
    createdAt: input.createdAt,
    deterministicHash: hashCoordinationReplayValue("coordination-boundary-lineage-entry", {
      verdict,
      boundaryState,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendBoundaryLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const replayLedger = appendBoundaryReplayLedger({
    existing: input.existingReplayLedger,
    scope: "coordination-boundary-enforcement",
    payload: Object.freeze({
      boundaryId: input.boundaryId,
      coordinationId: input.coordinationRecord.coordinationId,
      verdict,
      boundaryState,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
    }),
  });

  const record = Object.freeze({
    boundaryId: input.boundaryId,
    coordinationId: input.coordinationRecord.coordinationId,
    verdict,
    boundaryState,
    governanceSnapshotId: input.coordinationRecord.governanceSnapshotId,
    replaySnapshotId: input.coordinationRecord.replaySnapshotId,
    escalationSnapshotId: input.coordinationRecord.escalationSnapshotId,
    replaySafe: !allErrors.some((item) => item.code.includes("REPLAY")),
    failClosed: verdict !== "VALID_BOUND_COORDINATION" || boundaryState === "fail_closed",
    createdAt: input.createdAt,
  });

  const base = Object.freeze({
    record,
    authorityContract,
    violations,
    lineage,
    replayLedger,
    evidence,
    orchestrationInspection,
    recursiveInspection,
    violationInspection,
    warnings: Object.freeze([
      "Coordination boundary enforcement remains deterministic, inspectable, and non-executing.",
    ]),
    errors: allErrors,
    derivedOnly: true as const,
  });

  return Object.freeze({
    ...base,
    deterministicHash: hashCoordinationReplayValue("coordination-boundary-enforcement-result", base),
  });
}

export const enforceCoordinationBoundaries = buildCoordinationBoundaryEnforcement;
