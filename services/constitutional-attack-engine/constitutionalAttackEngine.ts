import type {
  AttackLineageEntry,
  ConstitutionalAttackAuthorityContract,
  ConstitutionalAttackEngineInput,
  ConstitutionalAttackResult,
  AttackViolation,
} from "@/types/constitutional-attack-engine";
import { registerAdversarialScenario } from "./adversarialScenarioRegistry";
import { generateAttackVector } from "./attackVectorGenerator";
import { simulateGovernanceAttack } from "./governanceAttackSimulator";
import { simulateEscalationAbuse } from "./escalationAbuseSimulator";
import { simulateDependencyCorruption } from "./dependencyCorruptionSimulator";
import { simulateConfidenceSpoof } from "./confidenceSpoofSimulator";
import { validateAttackReplay } from "./attackReplayValidator";
import { validateAttackIsolation } from "./attackIsolationValidator";
import { validateAttackConsistency } from "./attackConsistencyValidator";
import { classifyConstitutionalWeaknesses } from "./constitutionalWeaknessClassifier";
import { buildAttackEvidence } from "./attackEvidenceBuilder";
import { resolveAttackSimulationState } from "./attackFreezeCoordinator";
import { appendAttackAuditLedger } from "./attackAuditLedger";
import { appendAttackLineage } from "@/services/attack-lineage/attackLineageEngine";
import { appendAttackReplayLedger } from "@/services/attack-lineage/attackReplayLineage";
import { inspectAttackSimulation } from "@/services/attack-visibility/attackSimulationInspector";
import { inspectGovernanceAttack } from "@/services/attack-visibility/governanceAttackInspector";
import { inspectEscalationAttack } from "@/services/attack-visibility/escalationAttackInspector";
import { inspectDependencyAttack } from "@/services/attack-visibility/dependencyAttackInspector";
import { inspectConfidenceAttack } from "@/services/attack-visibility/confidenceAttackInspector";
import { inspectReplayAttack } from "@/services/attack-visibility/replayAttackInspector";
import { inspectConstitutionalWeaknesses } from "@/services/attack-visibility/constitutionalWeaknessInspector";
import { hashConstitutionalAttackValue } from "./deterministicAttackHasher";

function buildAuthorityContract(): ConstitutionalAttackAuthorityContract {
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

function buildIsolationViolations(
  input: ConstitutionalAttackEngineInput,
  errorCodes: readonly string[],
): readonly AttackViolation[] {
  if (!errorCodes.some((item) => item.includes("EXECUTION") || item.includes("SCHEDULER") || item.includes("ISOLATION"))) {
    return Object.freeze([]);
  }
  return Object.freeze([
    Object.freeze({
      violationId: hashConstitutionalAttackValue("isolation-violation-id", input.attackId),
      attackId: input.attackId,
      coordinationId: input.coordinationRecord.coordinationId,
      domain: "isolation" as const,
      severity: "critical" as const,
      createdAt: input.createdAt,
      deterministicHash: hashConstitutionalAttackValue("isolation-violation", errorCodes),
    }),
  ]);
}

export function buildConstitutionalAttackEngine(
  input: ConstitutionalAttackEngineInput,
): ConstitutionalAttackResult {
  const authorityContract = buildAuthorityContract();
  const scenario = registerAdversarialScenario(input);
  const vector = generateAttackVector({
    scenario,
    deterministicSeed: input.deterministicSeed,
  });

  const governance = simulateGovernanceAttack(input);
  const escalation = simulateEscalationAbuse(input);
  const dependency = simulateDependencyCorruption(input);
  const confidence = simulateConfidenceSpoof(input);
  const replay = validateAttackReplay(input);
  const isolationErrors = validateAttackIsolation(input);
  const consistencyErrors = validateAttackConsistency(input);

  const errors = Object.freeze([
    ...governance.errors,
    ...escalation.errors,
    ...dependency.errors,
    ...confidence.errors,
    ...replay.errors,
    ...isolationErrors,
    ...consistencyErrors,
  ]);

  const weaknesses = classifyConstitutionalWeaknesses({
    attackInput: input,
    errors,
    inheritedWeaknesses: Object.freeze([
      ...governance.weaknesses,
      ...escalation.weaknesses,
      ...dependency.weaknesses,
      ...confidence.weaknesses,
      ...replay.weaknesses,
    ]),
  });

  const violations = Object.freeze([
    ...governance.violations,
    ...escalation.violations,
    ...dependency.violations,
    ...confidence.violations,
    ...replay.violations,
    ...buildIsolationViolations(input, errors.map((item) => item.code)),
  ] satisfies readonly AttackViolation[]);

  const governanceInspection = inspectGovernanceAttack({
    governanceSnapshotId: input.coordinationRecord.governanceSnapshotId,
    governanceLinked: governance.governanceLinked,
  });
  const escalationInspection = inspectEscalationAttack(input.escalationResult);
  const dependencyInspection = inspectDependencyAttack({
    dependencyLineageId: input.readinessResult.lineage.lineageId,
    dependencySafe: dependency.dependencySafe,
  });
  const confidenceInspection = inspectConfidenceAttack({
    confidenceLinked: confidence.confidenceLinked,
    confidenceSafe: confidence.confidenceSafe,
  });
  const replayInspection = inspectReplayAttack(input);

  const attackState = resolveAttackSimulationState({
    errors,
    governanceLinked: governance.governanceLinked,
    replayDeterministic: replay.replayDeterministic,
    inheritedFailClosed: input.readinessResult.record.failClosed || input.boundaryResult.record.failClosed,
  });

  const reasons = Object.freeze(errors.map((item) => item.code));
  const evidence = buildAttackEvidence({
    attackInput: input,
    governanceInspection,
    escalationInspection,
    dependencyInspection,
    replayInspection,
    reasons,
  });

  const lineageEntry: AttackLineageEntry = Object.freeze({
    entryId: hashConstitutionalAttackValue("lineage-entry-id", {
      attackId: input.attackId,
      createdAt: input.createdAt,
    }),
    attackId: input.attackId,
    scenarioId: scenario.scenarioId,
    coordinationId: input.coordinationRecord.coordinationId,
    attackState,
    createdAt: input.createdAt,
    deterministicHash: hashConstitutionalAttackValue("lineage-entry", {
      attackState,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendAttackLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const replayLedger = appendAttackReplayLedger({
    existing: input.existingReplayLedger,
    scope: "constitutional-attack-engine",
    payload: Object.freeze({
      attackId: input.attackId,
      scenarioId: scenario.scenarioId,
      attackState,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const auditLedger = appendAttackAuditLedger({
    existing: replayLedger,
    scope: "constitutional-attack-audit",
    payload: Object.freeze({
      attackId: input.attackId,
      attackState,
      weaknessCount: weaknesses.length,
      lineageHash: lineage.lineageHash,
    }),
  });

  const attackInspection = inspectAttackSimulation({
    attackId: input.attackId,
    coordinationId: input.coordinationRecord.coordinationId,
    attackState,
    categories: Object.freeze([scenario.category]),
  });
  const weaknessInspection = inspectConstitutionalWeaknesses({
    attackId: input.attackId,
    weaknesses,
  });

  const record = Object.freeze({
    attackId: input.attackId,
    coordinationId: input.coordinationRecord.coordinationId,
    readinessCertificationId: input.readinessResult.record.certificationId,
    scenarioId: scenario.scenarioId,
    scenarioCategory: scenario.category,
    attackState,
    governanceSnapshotId: input.coordinationRecord.governanceSnapshotId,
    replaySnapshotId: input.coordinationRecord.replaySnapshotId,
    escalationSnapshotId: input.coordinationRecord.escalationSnapshotId,
    replaySafe: replay.replayDeterministic && !errors.some((item) => item.code.includes("REPLAY")),
    failClosed: attackState === "FAIL_CLOSED",
    createdAt: input.createdAt,
  });

  const base = Object.freeze({
    record,
    authorityContract,
    scenario,
    vector,
    weaknesses,
    violations,
    lineage,
    replayLedger: auditLedger,
    evidence,
    attackInspection,
    governanceInspection,
    escalationInspection,
    dependencyInspection,
    confidenceInspection,
    replayInspection,
    weaknessInspection,
    warnings: Object.freeze([
      "Constitutional attack simulation remains synthetic, isolated, deterministic, and non-executing.",
    ]),
    errors,
    derivedOnly: true as const,
  });

  return Object.freeze({
    ...base,
    deterministicHash: hashConstitutionalAttackValue("result", base),
  });
}

export const simulateConstitutionalAttack = buildConstitutionalAttackEngine;
