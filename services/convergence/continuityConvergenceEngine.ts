import { computeDivergenceScore } from "./convergenceAssessment";
import { buildConvergenceAuditRecord } from "./convergenceAudit";
import { correlateConvergenceSignals } from "./convergenceCorrelation";
import { detectConvergenceDivergence } from "./divergenceDetection";
import { detectOrphanedOperations } from "./orphanedOperationDetection";
import { applyConvergencePolicies } from "./convergencePolicies";
import { analyzeRuntimeDrift } from "./runtimeDriftAnalysis";
import { analyzeStaleOwnership } from "./staleOwnershipAnalysis";
import { buildConvergenceTelemetry } from "./convergenceTelemetry";
import type { ContinuityConvergenceInput, ContinuityConvergenceResult } from "./convergenceTypes";

export function evaluateContinuityConvergence(input: ContinuityConvergenceInput): {
  result: ContinuityConvergenceResult;
  audit: ReturnType<typeof buildConvergenceAuditRecord>;
  telemetry: ReturnType<typeof buildConvergenceTelemetry>;
} {
  const divergence = detectConvergenceDivergence(input);
  const orphaned = detectOrphanedOperations({
    blockedRecoveries: input.blockedRecoveries,
    quarantinedExecutions: input.quarantinedExecutions,
    leaseConflicts: input.leaseConflicts,
    activeRecoveries: input.activeRecoveries,
  });
  const staleOwnership = analyzeStaleOwnership({
    leaseConflicts: input.leaseConflicts,
    stewardshipState: input.stewardship?.state,
    escalationFrozen: input.escalation?.frozen,
  });
  const correlation = correlateConvergenceSignals(input);
  const drift = analyzeRuntimeDrift({
    degradationRate: input.stability?.degradationRate,
    replayInstabilityScore: input.stability?.replayInstabilityScore,
    escalationPressure: input.stability?.escalationPressure,
    dependencyInstabilityScore: input.stability?.dependencyInstabilityScore,
    orphanedOperationCount: orphaned.orphanedOperations.length,
    survivabilityScore: input.stability?.survivabilityScore,
    disputed: Boolean(input.stability?.disputed || input.stewardship?.state === "DISPUTED" || input.verification?.disputed),
  });

  const divergenceScore = computeDivergenceScore({
    driftVelocity: drift.driftVelocity,
    replayDrift: drift.replayDrift,
    escalationInstability: drift.escalationInstability,
    dependencySpread: drift.dependencySpread,
    orphanedOperationGrowth: drift.orphanedOperationGrowth,
    disputePressure: (divergence.unresolvedDisputes.length > 0 || input.stability?.disputed) ? 0.8 : 0.15,
  });

  const policy = applyConvergencePolicies({
    divergenceScore,
    replayDivergence: divergence.categories.includes("REPLAY_DIVERGENCE"),
    escalationConflict: divergence.categories.includes("ESCALATION_DIVERGENCE"),
    disputed: Boolean(input.stability?.disputed || input.stewardship?.state === "DISPUTED" || input.verification?.disputed),
    systemicRisk: divergence.categories.includes("SYSTEMIC_DIVERGENCE"),
    unstableDependencyPropagation: divergence.categories.includes("DEPENDENCY_PROPAGATION_DIVERGENCE"),
  });

  const evidence = Array.from(new Set([
    ...(input.verification?.evidence || []),
    ...(input.stewardship?.evidence || []),
    ...((input.auditHistory || []).slice(0, 8).map((event) => String(event.id || "")).filter(Boolean)),
  ]));

  const result: ContinuityConvergenceResult = {
    converged: policy.state === "CONVERGED",
    state: policy.state,
    divergenceScore,
    divergenceReasons: Array.from(new Set([
      ...divergence.divergenceReasons,
      ...drift.reasons,
      ...orphaned.reasons,
      ...staleOwnership.reasons,
      ...correlation.reasons,
      ...policy.reasons,
    ])),
    requiresContainment: policy.requiresContainment,
    requiresEscalation: policy.requiresEscalation,
    requiresFreeze: policy.requiresFreeze,
    continuityConfidence: correlation.continuityConfidence,
    replayConfidence: correlation.replayConfidence,
    survivabilityConfidence: correlation.survivabilityConfidence,
    escalationStabilityConfidence: correlation.escalationStabilityConfidence,
    affectedExecutions: orphaned.affectedExecutions,
    affectedSubsystems: Array.from(new Set(divergence.affectedSubsystems)),
    orphanedOperations: orphaned.orphanedOperations,
    staleOwnershipClaims: staleOwnership.staleOwnershipClaims,
    unresolvedDisputes: divergence.unresolvedDisputes,
    unstableDependencies: input.continuity?.degradedDependencies || [],
    evidence,
    timestamp: input.timestamp,
  };

  const audit = buildConvergenceAuditRecord({
    state: result.state,
    divergenceScore: result.divergenceScore,
    divergenceCategories: divergence.categories,
    evidence: result.evidence,
    affectedExecutions: result.affectedExecutions,
    affectedSubsystems: result.affectedSubsystems,
    recommendations: [
      ...(result.requiresFreeze ? ["MAINTAIN_FREEZE"] : []),
      ...(result.requiresContainment ? ["RETAIN_CONTAINMENT"] : []),
      ...(result.requiresEscalation ? ["ESCALATE_FOR_REVIEW"] : []),
    ],
    freezeReason: result.requiresFreeze ? result.divergenceReasons[0] : undefined,
    timestamp: result.timestamp,
  });

  const telemetry = buildConvergenceTelemetry({
    continuityConfidence: result.continuityConfidence,
    divergenceScore: result.divergenceScore,
    replayDrift: drift.replayDrift,
    escalationInstability: drift.escalationInstability,
    orphanedOperationCount: result.orphanedOperations.length,
    staleOwnershipCount: result.staleOwnershipClaims.length,
    unresolvedDisputeCount: result.unresolvedDisputes.length,
    systemicRisk: result.state === "SYSTEMIC_RISK" ? 1 : 0,
    requiresContainment: result.requiresContainment,
    requiresEscalation: result.requiresEscalation,
    timestamp: result.timestamp,
  });

  return {
    result,
    audit,
    telemetry,
  };
}
