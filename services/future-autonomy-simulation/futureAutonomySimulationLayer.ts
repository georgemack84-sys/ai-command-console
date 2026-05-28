import type {
  FutureAutonomyError,
  FutureAutonomyFinding,
  FutureAutonomyLineageEntry,
  FutureAutonomyResult,
  FutureAutonomySimulationInput,
  FutureAutonomyViolation,
} from "@/types/future-autonomy";
import { buildFutureAutonomyAuthorityContract } from "./futureAutonomyContracts";
import { simulateBoundedCoordination } from "./boundedCoordinationSimulator";
import { simulateEscalationPropagation } from "./escalationPropagationSimulator";
import { simulateRecommendationChain } from "./recommendationChainSimulator";
import { simulateApprovalRouting } from "./approvalRoutingSimulator";
import { simulateConfidenceEvolution } from "./confidenceEvolutionSimulator";
import { simulateOrchestrationTopology } from "./orchestrationTopologySimulator";
import { classifyFutureAutonomyRisk } from "./futureAutonomyRiskClassifier";
import { validateFutureAutonomyContainment } from "./futureAutonomyContainmentValidator";
import { validateFutureAutonomyIsolation } from "./futureAutonomyIsolationValidator";
import { resolveFutureAutonomyState } from "./futureAutonomyFailClosedCoordinator";
import { freezeFutureAutonomyState } from "./futureAutonomyFreezeCoordinator";
import { validateFutureAutonomyReplay } from "./futureAutonomyReplayValidator";
import { buildFutureAutonomyReplayLineage } from "./futureAutonomyReplayLineage";
import { buildFutureAutonomyLineageGraph } from "./futureAutonomyLineageGraph";
import { buildFutureAutonomyEvidence } from "./futureAutonomyEvidenceBuilder";
import { buildFutureAutonomyRiskReport } from "./futureAutonomyRiskReportBuilder";
import { appendImmutableFutureAutonomyLedger } from "./immutableFutureAutonomyLedger";
import { appendFutureAutonomyAuditLedger } from "./futureAutonomyAuditLedger";
import { inspectFutureAutonomyBoundary } from "./futureAutonomyBoundaryInspector";
import { appendFutureAutonomyLineage } from "@/services/future-autonomy-simulation/internalFutureAutonomyLineageEngine";
import { hashFutureAutonomyValue } from "./futureAutonomyHashEngine";

function buildViolations(
  input: FutureAutonomySimulationInput,
  errors: readonly FutureAutonomyError[],
): readonly FutureAutonomyViolation[] {
  return Object.freeze(errors.map((item) => Object.freeze({
    violationId: hashFutureAutonomyValue(`future-autonomy-violation-id:${item.code}`, {
      simulationId: input.simulationId,
      code: item.code,
    }),
    simulationId: input.simulationId,
    coordinationId: input.governanceDriftResult.record.coordinationId,
    domain: item.code.includes("GOVERNANCE")
      ? "governance"
      : item.code.includes("REPLAY")
        ? "replay"
        : item.code.includes("ESCALATION")
          ? "escalation"
          : item.code.includes("APPROVAL")
            ? "approval"
            : item.code.includes("CONFIDENCE")
              ? "confidence"
              : item.code.includes("ISOLATION") || item.code.includes("RUNTIME") || item.code.includes("EXECUTION")
                ? "isolation"
                : item.code.includes("HIDDEN") || item.code.includes("RECURSIVE") || item.code.includes("PRIVILEGE")
                  ? "boundary"
                  : "topology",
    severity: "critical" as const,
    createdAt: input.createdAt,
    deterministicHash: hashFutureAutonomyValue(`future-autonomy-violation:${item.code}`, item),
  })));
}

export function simulateFutureAutonomy(
  input: FutureAutonomySimulationInput,
): FutureAutonomyResult {
  const authorityContract = buildFutureAutonomyAuthorityContract();
  const boundedCoordination = simulateBoundedCoordination(input);
  const escalation = simulateEscalationPropagation(input);
  const recommendation = simulateRecommendationChain(input);
  const approval = simulateApprovalRouting(input);
  const confidence = simulateConfidenceEvolution(input);
  const topology = simulateOrchestrationTopology(input);
  const containmentErrors = validateFutureAutonomyContainment(input);
  const isolationErrors = validateFutureAutonomyIsolation(input);
  const replayErrors = validateFutureAutonomyReplay(input);

  const findings = Object.freeze([
    ...boundedCoordination,
    ...escalation.findings,
    ...recommendation.findings,
    ...approval.findings,
    ...confidence.findings,
    ...topology.findings,
  ] satisfies readonly FutureAutonomyFinding[]);

  const errors = Object.freeze([
    ...recommendation.errors,
    ...approval.errors,
    ...confidence.errors,
    ...topology.errors,
    ...containmentErrors,
    ...isolationErrors,
    ...replayErrors,
  ]);

  const riskLevel = classifyFutureAutonomyRisk(findings);
  const preFreezeStatus = resolveFutureAutonomyState({
    errors,
    inheritedFailClosed: input.governanceDriftResult.record.failClosed,
    riskLevel,
  });
  const status = freezeFutureAutonomyState({
    status: preFreezeStatus,
    riskLevel,
  });

  const replayLineage = buildFutureAutonomyReplayLineage({
    simulationId: input.simulationId,
    governanceDriftResult: input.governanceDriftResult,
    replaySafe: replayErrors.length === 0 && input.governanceDriftResult.record.replaySafe,
  });
  const boundaryInspection = inspectFutureAutonomyBoundary({
    topologyFrozen: topology.topology.topologyFrozen,
    isolationSafe: isolationErrors.length === 0,
  });

  const evidence = buildFutureAutonomyEvidence({
    simulationInput: input,
    replayHash: replayLineage.replayHash,
    escalationHash: escalation.escalationHash,
    confidenceHash: confidence.confidenceHash,
    topologyHash: topology.topology.topologyHash,
    boundaryHash: boundaryInspection.inspectionHash,
    reasons: Object.freeze(errors.map((item) => item.code)),
  });

  const lineageEntry: FutureAutonomyLineageEntry = Object.freeze({
    entryId: hashFutureAutonomyValue("future-autonomy-lineage-entry-id", {
      simulationId: input.simulationId,
      createdAt: input.createdAt,
    }),
    simulationId: input.simulationId,
    coordinationId: input.governanceDriftResult.record.coordinationId,
    status,
    categories: Object.freeze(findings.map((item) => item.category)),
    createdAt: input.createdAt,
    deterministicHash: hashFutureAutonomyValue("future-autonomy-lineage-entry", {
      status,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendFutureAutonomyLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const lineageGraph = buildFutureAutonomyLineageGraph(lineage);
  const replayLedger = appendImmutableFutureAutonomyLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      simulationId: input.simulationId,
      driftId: input.governanceDriftResult.record.driftId,
      status,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
    }),
    scope: "future-autonomy-simulation",
  });
  const auditLedger = appendFutureAutonomyAuditLedger({
    existing: replayLedger,
    payload: Object.freeze({
      simulationId: input.simulationId,
      status,
      findingCount: findings.length,
      lineageHash: lineage.lineageHash,
    }),
    scope: "future-autonomy-audit",
  });

  const violations = buildViolations(input, errors);
  const riskReport = buildFutureAutonomyRiskReport({
    simulationId: input.simulationId,
    riskLevel,
    findings,
  });

  const hashes = Object.freeze({
    simulationHash: hashFutureAutonomyValue("future-autonomy-simulation-hash", {
      simulationId: input.simulationId,
      deterministicSeed: input.deterministicSeed,
      validatorVersionId: input.validatorVersionId,
    }),
    lineageHash: lineage.lineageHash,
    evidenceHash: evidence.evidenceHash,
    replayHash: replayLineage.replayHash,
    escalationHash: escalation.escalationHash,
    confidenceHash: confidence.confidenceHash,
    topologyHash: topology.topology.topologyHash,
    finalResultHash: hashFutureAutonomyValue("future-autonomy-final-result-hash", {
      simulationId: input.simulationId,
      status,
      riskLevel,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      replayHash: replayLineage.replayHash,
    }),
  });

  const result = Object.freeze({
    simulationId: input.simulationId,
    status,
    riskLevel,
    governanceBound: true as const,
    replaySafe: true as const,
    advisoryOnly: true as const,
    authorityGranted: false as const,
    runtimeMutationAllowed: false as const,
    orchestrationAllowed: false as const,
    findings,
    violations,
    escalationRequirements: escalation.escalationRequirements,
    evidenceHash: evidence.evidenceHash,
    lineageHash: lineage.lineageHash,
    replayHash: replayLineage.replayHash,
    finalResultHash: hashes.finalResultHash,
  });

  const record = Object.freeze({
    simulationId: input.simulationId,
    coordinationId: input.governanceDriftResult.record.coordinationId,
    driftId: input.governanceDriftResult.record.driftId,
    replayAttackId: input.governanceDriftResult.record.replayAttackId,
    recommendationId: input.governanceDriftResult.record.recommendationId,
    governanceSnapshotId: input.governanceDriftResult.record.governanceSnapshotId,
    replaySnapshotId: input.governanceDriftResult.record.replaySnapshotId,
    escalationSnapshotId: input.governanceDriftResult.record.escalationSnapshotId,
    status,
    riskLevel,
    replaySafe: true,
    failClosed: status === "blocked" || status === "frozen",
    createdAt: input.createdAt,
  });

  return Object.freeze({
    record,
    authorityContract,
    result,
    findings,
    violations,
    escalationRequirements: escalation.escalationRequirements,
    lineage,
    replayLineage,
    lineageGraph,
    topology: topology.topology,
    replayLedger: auditLedger,
    evidence,
    hashes,
    boundaryInspection,
    riskReport,
    warnings: Object.freeze([]),
    errors,
    deterministicHash: hashes.finalResultHash,
    derivedOnly: true as const,
  });
}

export const detectFutureAutonomy = simulateFutureAutonomy;
