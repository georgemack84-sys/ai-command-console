import type {
  RecommendationIntegrityInput,
  RecommendationIntegrityResult,
  RecommendationLineage,
  RecommendationLineageEntry,
  RecommendationViolation,
} from "@/types/recommendation-integrity";
import { buildRecommendationIntegrityAuthorityContract } from "./recommendationIntegrityContracts";
import { simulateRecommendationCorruption } from "./recommendationCorruptionSimulator";
import { detectFabricatedEvidence } from "./fabricatedEvidenceDetector";
import { validateConfidenceIntegrity } from "./confidenceIntegrityValidator";
import { validateRecommendationGovernanceBinding } from "./governanceBindingValidator";
import { detectEscalationSuppression } from "./escalationSuppressionDetector";
import { validateApprovalIntegrity } from "./approvalIntegrityValidator";
import { validateRecommendationReplayConsistency } from "./replayConsistencyValidator";
import { validateRecommendationReplay } from "./recommendationReplayValidator";
import { detectAuthorityDrift } from "./authorityDriftDetector";
import { classifyAdvisoryAuthority } from "./advisoryAuthorityClassifier";
import { detectHiddenRecommendationOrchestration } from "./hiddenOrchestrationDetector";
import { resolveRecommendationIntegrityState } from "./recommendationFreezeCoordinator";
import { buildRecommendationEvidence } from "./recommendationEvidenceBuilder";
import { appendRecommendationAuditLedger } from "./recommendationAuditLedger";
import { classifyRecommendationWeaknesses } from "./recommendationWeaknessClassifier";
import { appendRecommendationReplayLedger } from "@/services/recommendation-lineage/recommendationReplayLineage";
import { inspectRecommendationIntegrity } from "@/services/recommendation-visibility/recommendationIntegrityInspector";
import { inspectRecommendationReplay } from "@/services/recommendation-visibility/recommendationReplayInspector";
import { inspectGovernanceBinding } from "@/services/recommendation-visibility/governanceBindingInspector";
import { inspectConfidenceIntegrity } from "@/services/recommendation-visibility/confidenceIntegrityInspector";
import { inspectEscalationIntegrity } from "@/services/recommendation-visibility/escalationIntegrityInspector";
import { inspectAuthorityDrift } from "@/services/recommendation-visibility/authorityDriftInspector";
import { hashRecommendationIntegrityValue } from "./deterministicRecommendationHasher";

function appendRecommendationIntegrityLineage(input: {
  existing?: RecommendationLineage;
  entry: RecommendationLineageEntry;
}): RecommendationLineage {
  const entries = Object.freeze([...(input.existing?.entries ?? []), input.entry]);
  const lineageId = input.existing?.lineageId
    ?? hashRecommendationIntegrityValue("recommendation-integrity-lineage-id", {
      recommendationId: input.entry.recommendationId,
      createdAt: input.entry.createdAt,
    });

  return Object.freeze({
    lineageId,
    entries,
    lineageHash: hashRecommendationIntegrityValue("recommendation-integrity-lineage", {
      lineageId,
      entries,
    }),
  });
}

function buildIsolationViolations(
  input: RecommendationIntegrityInput,
  errorCodes: readonly string[],
): readonly RecommendationViolation[] {
  if (!errorCodes.some((item) => item.includes("ISOLATION") || item.includes("RUNTIME"))) {
    return Object.freeze([]);
  }
  return Object.freeze([
    Object.freeze({
      violationId: hashRecommendationIntegrityValue("isolation-violation-id", input.recommendationId),
      recommendationId: input.recommendationId,
      coordinationId: input.attackResult.record.coordinationId,
      domain: "isolation" as const,
      severity: "critical" as const,
      createdAt: input.createdAt,
      deterministicHash: hashRecommendationIntegrityValue("isolation-violation", errorCodes),
    }),
  ]);
}

export function buildRecommendationIntegritySimulation(
  input: RecommendationIntegrityInput,
): RecommendationIntegrityResult {
  const authorityContract = buildRecommendationIntegrityAuthorityContract();
  const corruption = simulateRecommendationCorruption(input);
  const fabricatedEvidenceErrors = detectFabricatedEvidence(input);
  const confidence = validateConfidenceIntegrity(input);
  const governance = validateRecommendationGovernanceBinding(input);
  const escalation = detectEscalationSuppression(input);
  const approval = validateApprovalIntegrity(input);
  const replayConsistencyErrors = validateRecommendationReplayConsistency(input);
  const replay = validateRecommendationReplay(input);
  const authority = detectAuthorityDrift(input);
  const advisoryAuthorityErrors = classifyAdvisoryAuthority(input);
  const orchestration = detectHiddenRecommendationOrchestration(input);

  const errors = Object.freeze([
    ...corruption.errors,
    ...fabricatedEvidenceErrors,
    ...confidence.errors,
    ...governance.errors,
    ...escalation.errors,
    ...approval.errors,
    ...replayConsistencyErrors,
    ...replay.errors,
    ...authority.errors,
    ...advisoryAuthorityErrors,
    ...orchestration.errors,
  ]);

  const weaknesses = classifyRecommendationWeaknesses({
    recommendationInput: input,
    errors,
    inheritedWeaknesses: Object.freeze([
      ...corruption.weaknesses,
      ...confidence.weaknesses,
      ...governance.weaknesses,
      ...escalation.weaknesses,
      ...approval.weaknesses,
      ...authority.weaknesses,
      ...orchestration.weaknesses,
    ]),
  });

  const violations = Object.freeze([
    ...corruption.violations,
    ...confidence.violations,
    ...governance.violations,
    ...escalation.violations,
    ...approval.violations,
    ...authority.violations,
    ...orchestration.violations,
    ...buildIsolationViolations(input, errors.map((item) => item.code)),
  ] satisfies readonly RecommendationViolation[]);

  const replayInspection = inspectRecommendationReplay(input);
  const governanceInspection = inspectGovernanceBinding({
    governanceSnapshotId: input.attackResult.record.governanceSnapshotId,
    governanceLinked: governance.governanceLinked,
  });
  const confidenceInspection = inspectConfidenceIntegrity({
    confidenceLinked: confidence.confidenceLinked,
    confidenceSafe: confidence.confidenceSafe,
  });
  const escalationInspection = inspectEscalationIntegrity({
    escalationId: input.attackResult.record.attackId,
    escalationState: input.attackResult.escalationInspection.escalationState,
    escalationLineageId: input.attackResult.escalationInspection.escalationLineageId,
  });
  const authorityDriftInspection = inspectAuthorityDrift({
    authorityDriftDetected: authority.authorityDriftDetected,
    hiddenOrchestrationDetected: orchestration.hiddenOrchestrationDetected,
  });

  const recommendationState = resolveRecommendationIntegrityState({
    errors,
    governanceLinked: governance.governanceLinked,
    replayDeterministic: replay.replayDeterministic,
    inheritedFailClosed: input.attackResult.record.failClosed,
  });

  const reasons = Object.freeze(errors.map((item) => item.code));
  const evidence = buildRecommendationEvidence({
    recommendationInput: input,
    governanceInspection,
    escalationInspection,
    replayInspection,
    reasons,
  });

  const lineageEntry: RecommendationLineageEntry = Object.freeze({
    entryId: hashRecommendationIntegrityValue("lineage-entry-id", {
      recommendationId: input.recommendationId,
      createdAt: input.createdAt,
    }),
    recommendationId: input.recommendationId,
    coordinationId: input.attackResult.record.coordinationId,
    recommendationState,
    createdAt: input.createdAt,
    deterministicHash: hashRecommendationIntegrityValue("lineage-entry", {
      recommendationState,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendRecommendationIntegrityLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const replayLedger = appendRecommendationReplayLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      recommendationId: input.recommendationId,
      attackId: input.attackResult.record.attackId,
      recommendationState,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
    }),
    scope: "recommendation-integrity",
  });
  const auditLedger = appendRecommendationAuditLedger({
    existing: replayLedger,
    payload: Object.freeze({
      recommendationId: input.recommendationId,
      recommendationState,
      weaknessCount: weaknesses.length,
      lineageHash: lineage.lineageHash,
    }),
    scope: "recommendation-integrity-audit",
  });

  const integrityInspection = inspectRecommendationIntegrity({
    recommendationId: input.recommendationId,
    coordinationId: input.attackResult.record.coordinationId,
    recommendationState,
  });

  const record = Object.freeze({
    recommendationId: input.recommendationId,
    coordinationId: input.attackResult.record.coordinationId,
    attackId: input.attackResult.record.attackId,
    recommendationState,
    governanceSnapshotId: input.attackResult.record.governanceSnapshotId,
    replaySnapshotId: input.attackResult.record.replaySnapshotId,
    escalationSnapshotId: input.attackResult.record.escalationSnapshotId,
    replaySafe: replay.replayDeterministic && !errors.some((item) => item.code.includes("REPLAY")),
    failClosed: recommendationState === "FAIL_CLOSED",
    createdAt: input.createdAt,
  });

  const base = Object.freeze({
    record,
    authorityContract,
    weaknesses,
    violations,
    lineage,
    replayLedger: auditLedger,
    evidence,
    integrityInspection,
    replayInspection,
    governanceInspection,
    confidenceInspection,
    escalationInspection,
    authorityDriftInspection,
    warnings: Object.freeze([
      "Recommendation integrity simulation remains advisory-only, deterministic, isolated, and non-executing.",
    ]),
    errors,
    derivedOnly: true as const,
  });

  return Object.freeze({
    ...base,
    deterministicHash: hashRecommendationIntegrityValue("result", base),
  });
}

export const simulateRecommendationIntegrity = buildRecommendationIntegritySimulation;
