import type {
  ConstitutionalReplayAttackInput,
  ConstitutionalReplayAttackResult,
  ConstitutionalReplayLineageEntry,
  ConstitutionalReplayViolation,
  ConstitutionalReplayDriftRecord,
} from "@/types/constitutional-replay";
import { buildConstitutionalReplayAuthorityContract } from "./constitutionalReplayContracts";
import { registerReplayAttackScenario } from "./replayAttackScenarioRegistry";
import { simulateReplayCorruption } from "./replayCorruptionSimulator";
import { detectValidatorDriftAttack } from "./validatorDriftAttackEngine";
import { detectGovernanceSubstitution } from "./governanceSubstitutionDetector";
import { detectDependencyMutation } from "./dependencyMutationDetector";
import { detectReplayGapInjection } from "./replayGapInjectionDetector";
import { simulateEvidenceTampering } from "./evidenceTamperingSimulator";
import { detectReplayDivergence } from "./replayDivergenceDetector";
import { validateReplayIsolation } from "./replayIsolationValidator";
import { verifyReplayDeterminism } from "./replayDeterminismVerifier";
import { buildReplayTopologyRecord } from "./replayTopologyFreezeEngine";
import { resolveConstitutionalReplayState } from "./replayFailClosedCoordinator";
import { validateConstitutionalReplay } from "./constitutionalReplayValidator";
import { validateReplayLineageIntegrity } from "./replayLineageIntegrityEngine";
import { appendReplayAttackLedger } from "./immutableReplayAttackLedger";
import { appendReplayAttackAuditLedger } from "./replayAuditLedger";
import { buildReplayAttackEvidence } from "./replayAttackEvidenceBuilder";
import { buildReplayDependencyLineage } from "@/services/constitutional-replay-lineage/replayDependencyLineage";
import { buildReplayGovernanceLineage } from "@/services/constitutional-replay-lineage/replayGovernanceLineage";
import { buildReplayAttackLineageGraph } from "@/services/constitutional-replay-lineage/replayLineageGraph";
import { appendReplayAttackLineage } from "@/services/constitutional-replay-lineage/immutableReplayLineageEngine";
import { inspectReplayAttack } from "@/services/constitutional-replay-visibility/replayAttackInspector";
import { inspectReplayDrift } from "@/services/constitutional-replay-visibility/replayDriftInspector";
import { inspectGovernanceReplay } from "@/services/constitutional-replay-visibility/governanceReplayInspector";
import { inspectValidatorReplay } from "@/services/constitutional-replay-visibility/validatorReplayInspector";
import { inspectEvidenceReplay } from "@/services/constitutional-replay-visibility/evidenceReplayInspector";
import { inspectReplayBoundary } from "@/services/constitutional-replay-visibility/replayBoundaryInspector";
import { hashConstitutionalReplayValue } from "./deterministicReplayHasher";

function buildIsolationViolations(
  input: ConstitutionalReplayAttackInput,
  errorCodes: readonly string[],
): readonly ConstitutionalReplayViolation[] {
  if (!errorCodes.some((item) =>
    item.includes("ISOLATION") || item.includes("RUNTIME") || item.includes("HIDDEN")
  )) {
    return Object.freeze([]);
  }
  return Object.freeze([
    Object.freeze({
      violationId: hashConstitutionalReplayValue("isolation-violation-id", input.replayAttackId),
      replayAttackId: input.replayAttackId,
      coordinationId: input.approvalConflictResult.record.coordinationId,
      domain: "isolation" as const,
      severity: "critical" as const,
      createdAt: input.createdAt,
      deterministicHash: hashConstitutionalReplayValue("isolation-violation", errorCodes),
    }),
  ]);
}

function mergeDrifts(groups: readonly (readonly ConstitutionalReplayDriftRecord[])[]): readonly ConstitutionalReplayDriftRecord[] {
  return Object.freeze(groups.flat().sort((left, right) =>
    left.deterministicHash.localeCompare(right.deterministicHash),
  ));
}

export function buildConstitutionalReplayAttackHarness(
  input: ConstitutionalReplayAttackInput,
): ConstitutionalReplayAttackResult {
  const authorityContract = buildConstitutionalReplayAuthorityContract();
  const scenario = registerReplayAttackScenario(input);
  const validator = detectValidatorDriftAttack(input);
  const governance = detectGovernanceSubstitution(input);
  const dependency = detectDependencyMutation(input);
  const gaps = detectReplayGapInjection(input);
  const evidence = simulateEvidenceTampering(input);
  const divergence = detectReplayDivergence(input);
  const corruption = simulateReplayCorruption(input);
  const isolationErrors = validateReplayIsolation(input);
  const determinism = verifyReplayDeterminism(input);
  const validatorErrors = validateConstitutionalReplay(input);
  const lineageErrors = validateReplayLineageIntegrity(input);

  const errors = Object.freeze([
    ...validator.errors,
    ...governance.errors,
    ...dependency.errors,
    ...gaps.errors,
    ...evidence.errors,
    ...divergence.errors,
    ...corruption.errors,
    ...isolationErrors,
    ...determinism.errors,
    ...validatorErrors,
    ...lineageErrors,
  ]);

  const drifts = mergeDrifts([
    validator.drifts,
    governance.drifts,
    dependency.drifts,
    gaps.drifts,
    evidence.drifts,
    divergence.drifts,
    corruption.drifts,
  ]);

  const violations = Object.freeze([
    ...validator.violations,
    ...governance.violations,
    ...dependency.violations,
    ...gaps.violations,
    ...evidence.violations,
    ...divergence.violations,
    ...corruption.violations,
    ...buildIsolationViolations(input, errors.map((item) => item.code)),
  ] satisfies readonly ConstitutionalReplayViolation[]);

  const dependencyLineage = buildReplayDependencyLineage({
    recommendationLineageId: input.approvalConflictResult.evidence.recommendationLineageId,
    dependencySafe: dependency.dependencySafe,
  });
  const governanceLineage = buildReplayGovernanceLineage({
    governanceSnapshotId: input.approvalConflictResult.record.governanceSnapshotId,
    governanceLinked: governance.governanceLinked,
  });
  const topology = buildReplayTopologyRecord({
    replayAttackId: input.replayAttackId,
    dependencyLineageId: dependencyLineage.dependencyLineageId,
    topologyDriftDetected: !dependency.dependencySafe,
  });
  const replayAttackState = resolveConstitutionalReplayState({
    errors,
    governanceLinked: governance.governanceLinked,
    replayDeterministic: determinism.deterministic && divergence.replayDeterministic && validator.validatorDeterministic,
    inheritedFailClosed: input.approvalConflictResult.record.failClosed,
  });

  const replayInspection = inspectReplayAttack({
    replayAttackId: input.replayAttackId,
    coordinationId: input.approvalConflictResult.record.coordinationId,
    replayAttackState,
    categories: Object.freeze([scenario.category]),
  });
  const driftInspection = inspectReplayDrift({
    replayAttackId: input.replayAttackId,
    drifts,
  });
  const governanceInspection = inspectGovernanceReplay({
    governanceSnapshotId: governanceLineage.governanceSnapshotId,
    governanceLinked: governanceLineage.governanceLinked,
  });
  const validatorInspection = inspectValidatorReplay({
    validatorVersionId: input.validatorVersionId,
    validatorDeterministic: validator.validatorDeterministic,
  });
  const evidenceInspection = inspectEvidenceReplay({
    evidenceId: input.approvalConflictResult.evidence.evidenceId,
    evidenceImmutable: evidence.evidenceImmutable,
  });
  const boundaryInspection = inspectReplayBoundary({
    topologyFrozen: topology.topologyFrozen,
    isolationSafe: isolationErrors.length === 0,
  });

  const reasons = Object.freeze(errors.map((item) => item.code));
  const evidenceRecord = buildReplayAttackEvidence({
    replayAttackInput: input,
    governanceInspection,
    evidenceInspection,
    replayInspection,
    reasons,
  });

  const lineageEntry: ConstitutionalReplayLineageEntry = Object.freeze({
    entryId: hashConstitutionalReplayValue("lineage-entry-id", {
      replayAttackId: input.replayAttackId,
      createdAt: input.createdAt,
    }),
    replayAttackId: input.replayAttackId,
    coordinationId: input.approvalConflictResult.record.coordinationId,
    replayAttackState,
    createdAt: input.createdAt,
    deterministicHash: hashConstitutionalReplayValue("lineage-entry", {
      replayAttackState,
      evidenceHash: evidenceRecord.evidenceHash,
    }),
  });
  const lineage = appendReplayAttackLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const lineageGraph = buildReplayAttackLineageGraph(lineage);
  const replayLedger = appendReplayAttackLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      replayAttackId: input.replayAttackId,
      scenarioId: scenario.scenarioId,
      replayAttackState,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidenceRecord.evidenceHash,
    }),
    scope: "constitutional-replay-attack",
  });
  const auditLedger = appendReplayAttackAuditLedger({
    existing: replayLedger,
    payload: Object.freeze({
      replayAttackId: input.replayAttackId,
      replayAttackState,
      driftCount: drifts.length,
      lineageHash: lineage.lineageHash,
    }),
    scope: "constitutional-replay-audit",
  });

  const hashes = Object.freeze({
    scenarioHash: scenario.scenarioHash,
    lineageHash: lineage.lineageHash,
    governanceHash: governanceLineage.governanceHash,
    dependencyHash: dependencyLineage.dependencyHash,
    evidenceHash: evidenceRecord.evidenceHash,
    replayHash: replayInspection.inspectionHash,
    deterministicHash: hashConstitutionalReplayValue("hashes", {
      scenarioHash: scenario.scenarioHash,
      lineageHash: lineage.lineageHash,
      governanceHash: governanceLineage.governanceHash,
      dependencyHash: dependencyLineage.dependencyHash,
      evidenceHash: evidenceRecord.evidenceHash,
      replayHash: replayInspection.inspectionHash,
    }),
  });

  const record = Object.freeze({
    replayAttackId: input.replayAttackId,
    coordinationId: input.approvalConflictResult.record.coordinationId,
    conflictId: input.approvalConflictResult.record.conflictId,
    recommendationId: input.approvalConflictResult.record.recommendationId,
    attackId: input.approvalConflictResult.record.attackId,
    scenarioId: scenario.scenarioId,
    replayAttackState,
    governanceSnapshotId: input.approvalConflictResult.record.governanceSnapshotId,
    replaySnapshotId: input.approvalConflictResult.record.replaySnapshotId,
    escalationSnapshotId: input.approvalConflictResult.record.escalationSnapshotId,
    replaySafe: validator.validatorDeterministic && governance.governanceLinked && divergence.replayDeterministic,
    failClosed: replayAttackState === "FAIL_CLOSED",
    createdAt: input.createdAt,
  });

  const base = Object.freeze({
    record,
    authorityContract,
    scenario,
    drifts,
    violations,
    lineage,
    lineageGraph,
    topology,
    replayLedger: auditLedger,
    evidence: evidenceRecord,
    hashes,
    replayInspection,
    driftInspection,
    governanceInspection,
    validatorInspection,
    evidenceInspection,
    boundaryInspection,
    warnings: Object.freeze([
      "Constitutional replay attack simulation remains reconstructive-only, isolated, deterministic, and non-executing.",
    ]),
    errors,
    derivedOnly: true as const,
  });

  return Object.freeze({
    ...base,
    deterministicHash: hashConstitutionalReplayValue("result", base),
  });
}

export const simulateConstitutionalReplayAttack = buildConstitutionalReplayAttackHarness;
