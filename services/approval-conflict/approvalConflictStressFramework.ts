import type {
  ApprovalConflictResult,
  ApprovalConflictStressInput,
  ApprovalConflictLineageEntry,
  ApprovalConflictViolation,
} from "@/types/approval-conflict";
import { buildApprovalConflictAuthorityContract } from "./approvalConflictContracts";
import { simulateDependencyRevocation } from "./dependencyRevocationSimulator";
import { validateStaleApprovalReplay } from "./staleApprovalReplayValidator";
import { simulateConflictingOperators } from "./conflictingOperatorSimulator";
import { detectEscalationOverride } from "./escalationOverrideDetector";
import { detectInvalidInheritance } from "./invalidInheritanceDetector";
import { detectCircularApprovalChain } from "./circularApprovalChainDetector";
import { buildApprovalConflictEscalationRecord } from "./governanceEscalationTrigger";
import { buildApprovalConflictReplay } from "./approvalConflictReplayEngine";
import { validateApprovalConflictReplay } from "./approvalConflictReplayValidator";
import { validateApprovalConflictReplayIntegrity } from "./approvalConflictReplayValidator";
import { resolveApprovalConflictState } from "./approvalFreezeCoordinator";
import { buildApprovalConflictEvidence } from "./approvalConflictEvidenceBuilder";
import { appendImmutableApprovalConflictLedger } from "./immutableApprovalConflictLedger";
import { appendApprovalConflictAuditLedger } from "./approvalConflictAuditLedger";
import { appendApprovalConflictLineage } from "./approvalConflictLineageEngine";
import { buildApprovalConflictLineageGraph } from "@/services/approval-conflict-lineage/approvalConflictLineageGraph";
import { inspectApprovalConflict } from "@/services/approval-conflict-visibility/approvalConflictInspector";
import { inspectApprovalReplay } from "@/services/approval-conflict-visibility/approvalReplayInspector";
import { inspectEscalationConflict } from "@/services/approval-conflict-visibility/escalationConflictInspector";
import { inspectGovernanceConflict } from "@/services/approval-conflict-visibility/governanceConflictInspector";
import { inspectInheritanceConflict } from "@/services/approval-conflict-visibility/inheritanceConflictInspector";
import { inspectCircularConflict } from "@/services/approval-conflict-visibility/circularConflictInspector";
import { hashApprovalConflictValue } from "./deterministicApprovalConflictHasher";
import { classifyApprovalConflictWeaknesses } from "./approvalConflictClassifier";

function buildIsolationViolations(
  input: ApprovalConflictStressInput,
  errorCodes: readonly string[],
): readonly ApprovalConflictViolation[] {
  if (!errorCodes.some((item) =>
    item.includes("ISOLATION") || item.includes("RUNTIME") || item.includes("HIDDEN")
  )) {
    return Object.freeze([]);
  }
  return Object.freeze([
    Object.freeze({
      violationId: hashApprovalConflictValue("isolation-violation-id", input.conflictId),
      conflictId: input.conflictId,
      coordinationId: input.recommendationResult.record.coordinationId,
      domain: "isolation" as const,
      severity: "critical" as const,
      createdAt: input.createdAt,
      deterministicHash: hashApprovalConflictValue("isolation-violation", errorCodes),
    }),
  ]);
}

export function buildApprovalConflictStressFramework(
  input: ApprovalConflictStressInput,
): ApprovalConflictResult {
  const authorityContract = buildApprovalConflictAuthorityContract();
  const dependency = simulateDependencyRevocation(input);
  const staleReplay = validateStaleApprovalReplay(input);
  const operators = simulateConflictingOperators(input);
  const escalationOverride = detectEscalationOverride(input);
  const inheritance = detectInvalidInheritance(input);
  const circularity = detectCircularApprovalChain(input);
  const replay = validateApprovalConflictReplay(input);
  const replayIntegrity = validateApprovalConflictReplayIntegrity(input);

  const governanceLinked = !JSON.stringify(input.metadata ?? {}).toLowerCase().includes("missinggovernancelinkage")
    && !input.recommendationResult.errors.some((item) => item.code.includes("GOVERNANCE"));
  const governanceErrors = governanceLinked
    ? Object.freeze([])
    : Object.freeze([{
      code: "APPROVAL_CONFLICT_GOVERNANCE_LINKAGE_MISSING" as const,
      message: "Approval conflict simulation requires immutable governance linkage.",
      path: "metadata",
    }]);

  const errors = Object.freeze([
    ...dependency.errors,
    ...staleReplay.errors,
    ...operators.errors,
    ...escalationOverride.errors,
    ...inheritance.errors,
    ...circularity.errors,
    ...governanceErrors,
    ...replay.errors,
    ...replayIntegrity.errors,
  ]);

  const weaknesses = classifyApprovalConflictWeaknesses({
    conflictInput: input,
    errors,
    inheritedWeaknesses: Object.freeze([
      ...dependency.weaknesses,
      ...staleReplay.weaknesses,
      ...operators.weaknesses,
      ...escalationOverride.weaknesses,
      ...inheritance.weaknesses,
      ...circularity.weaknesses,
    ]),
  });

  const violations = Object.freeze([
    ...dependency.violations,
    ...staleReplay.violations,
    ...operators.violations,
    ...escalationOverride.violations,
    ...inheritance.violations,
    ...circularity.violations,
    ...buildIsolationViolations(input, errors.map((item) => item.code)),
  ] satisfies readonly ApprovalConflictViolation[]);

  const replayEngine = buildApprovalConflictReplay(input);
  const approvalConflictState = resolveApprovalConflictState({
    errors,
    governanceLinked,
    replayDeterministic: replay.replayDeterministic && replayIntegrity.replayDeterministic,
    inheritedFailClosed: input.recommendationResult.record.failClosed,
  });
  const governanceInspection = inspectGovernanceConflict({
    governanceSnapshotId: input.recommendationResult.record.governanceSnapshotId,
    governanceLinked,
  });
  const escalationInspection = inspectEscalationConflict({
    escalationId: input.recommendationResult.record.attackId,
    escalationState: input.recommendationResult.escalationInspection.escalationState,
    escalationLineageId: input.recommendationResult.escalationInspection.escalationLineageId,
  });
  const replayInspection = inspectApprovalReplay({
    replayId: replayEngine.replayId,
    replayDeterministic: replay.replayDeterministic && replayIntegrity.replayDeterministic,
    replayState: replayEngine.replayState,
    replayLedgerId: replayEngine.replayLedgerId,
  });
  const inheritanceInspection = inspectInheritanceConflict({
    inheritanceBlocked: inheritance.inheritanceBlocked,
    scopeIsolated: inheritance.scopeIsolated,
  });

  const reasons = Object.freeze(errors.map((item) => item.code));
  const evidence = buildApprovalConflictEvidence({
    conflictInput: input,
    governanceInspection,
    escalationInspection,
    replayInspection,
    reasons,
  });

  const lineageEntry: ApprovalConflictLineageEntry = Object.freeze({
    entryId: hashApprovalConflictValue("lineage-entry-id", {
      conflictId: input.conflictId,
      createdAt: input.createdAt,
    }),
    conflictId: input.conflictId,
    coordinationId: input.recommendationResult.record.coordinationId,
    approvalConflictState,
    createdAt: input.createdAt,
    deterministicHash: hashApprovalConflictValue("lineage-entry", {
      approvalConflictState,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendApprovalConflictLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const lineageGraph = buildApprovalConflictLineageGraph(lineage);
  const circularInspection = inspectCircularConflict({
    recursiveDetected: circularity.recursiveDetected || lineageGraph.recursive,
    graphHash: lineageGraph.graphHash,
  });

  const replayLedger = appendImmutableApprovalConflictLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      conflictId: input.conflictId,
      recommendationId: input.recommendationResult.record.recommendationId,
      approvalConflictState,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
    }),
    scope: "approval-conflict",
  });
  const auditLedger = appendApprovalConflictAuditLedger({
    existing: replayLedger,
    payload: Object.freeze({
      conflictId: input.conflictId,
      approvalConflictState,
      weaknessCount: weaknesses.length,
      lineageHash: lineage.lineageHash,
    }),
    scope: "approval-conflict-audit",
  });
  const integrityInspection = inspectApprovalConflict({
    conflictId: input.conflictId,
    coordinationId: input.recommendationResult.record.coordinationId,
    approvalConflictState,
  });
  const escalationRecord = buildApprovalConflictEscalationRecord({ errors });
  const record = Object.freeze({
    conflictId: input.conflictId,
    coordinationId: input.recommendationResult.record.coordinationId,
    recommendationId: input.recommendationResult.record.recommendationId,
    attackId: input.recommendationResult.record.attackId,
    approvalConflictState,
    governanceSnapshotId: input.recommendationResult.record.governanceSnapshotId,
    replaySnapshotId: input.recommendationResult.record.replaySnapshotId,
    escalationSnapshotId: input.recommendationResult.record.escalationSnapshotId,
    replaySafe: replayInspection.replayDeterministic && !errors.some((item) => item.code.includes("REPLAY")),
    failClosed: approvalConflictState === "FAIL_CLOSED",
    createdAt: input.createdAt,
  });

  const base = Object.freeze({
    record,
    authorityContract,
    weaknesses,
    violations,
    lineage,
    lineageGraph,
    replayLedger: auditLedger,
    evidence,
    escalationRecord,
    integrityInspection,
    replayInspection,
    governanceInspection,
    escalationInspection,
    inheritanceInspection,
    circularInspection,
    warnings: Object.freeze([
      "Approval conflict stress simulation remains advisory-only, deterministic, replay-safe, and non-executing.",
    ]),
    errors,
    derivedOnly: true as const,
  });
  return Object.freeze({
    ...base,
    deterministicHash: hashApprovalConflictValue("result", base),
  });
}

export const simulateApprovalConflictStress = buildApprovalConflictStressFramework;
