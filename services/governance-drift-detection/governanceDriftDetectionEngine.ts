import type {
  GovernanceDriftFinding,
  GovernanceDriftInput,
  GovernanceDriftLineageEntry,
  GovernanceDriftResult,
  GovernanceDriftViolation,
} from "@/types/governance-drift";
import { buildGovernanceDriftAuthorityContract } from "./governanceDriftContracts";
import { analyzeGovernanceDrift } from "./governanceDriftAnalyzer";
import { validateReplayDrift } from "./replayDriftValidator";
import { analyzeConfidenceDrift } from "./confidenceDriftAnalyzer";
import { detectEscalationDrift } from "./escalationDriftDetector";
import { validateDependencyDrift } from "./dependencyDriftValidator";
import { analyzeRecommendationDrift } from "./recommendationDriftAnalyzer";
import { correlateReplayDrift } from "./replayDriftCorrelationEngine";
import { resolveGovernanceDriftState } from "./driftFailClosedCoordinator";
import { routeGovernanceDriftEscalation } from "./driftEscalationRouter";
import { validateDriftContainment } from "./driftContainmentValidator";
import { validateDriftIsolation } from "./driftIsolationValidator";
import { validateConstitutionalDrift } from "./constitutionalDriftValidator";
import { buildGovernanceDriftEvidence } from "./constitutionalDriftEvidenceBuilder";
import { appendImmutableGovernanceDriftLedger } from "./immutableGovernanceDriftLedger";
import { appendGovernanceDriftAuditLedger } from "./governanceDriftAuditLedger";
import { buildGovernanceDriftDependencyLineage } from "@/services/governance-drift-lineage/governanceDriftDependencyLineage";
import { buildGovernanceDriftReplayLineage } from "@/services/governance-drift-lineage/governanceDriftReplayLineage";
import { buildGovernanceDriftEscalationLineage } from "@/services/governance-drift-lineage/governanceDriftEscalationLineage";
import { buildGovernanceDriftLineageGraph } from "@/services/governance-drift-lineage/governanceDriftLineageGraph";
import { appendGovernanceDriftLineage } from "@/services/governance-drift-lineage/internal/immutableGovernanceDriftLineageEngine";
import { inspectGovernanceDrift } from "@/services/governance-drift-visibility/governanceDriftInspector";
import { inspectReplayDrift } from "@/services/governance-drift-visibility/replayDriftInspector";
import { inspectConfidenceDrift } from "@/services/governance-drift-visibility/confidenceDriftInspector";
import { inspectEscalationDrift } from "@/services/governance-drift-visibility/escalationDriftInspector";
import { inspectDependencyDrift } from "@/services/governance-drift-visibility/dependencyDriftInspector";
import { inspectRecommendationDrift } from "@/services/governance-drift-visibility/recommendationDriftInspector";
import { inspectGovernanceDriftBoundary } from "@/services/governance-drift-visibility/governanceDriftBoundaryInspector";
import { hashGovernanceDriftValue } from "./deterministicDriftHasher";

function buildIsolationViolations(
  input: GovernanceDriftInput,
  errorCodes: readonly string[],
): readonly GovernanceDriftViolation[] {
  if (!errorCodes.some((item) => item.includes("ISOLATION") || item.includes("RUNTIME"))) {
    return Object.freeze([]);
  }
  return Object.freeze([
    Object.freeze({
      violationId: hashGovernanceDriftValue("isolation-violation-id", input.driftId),
      driftId: input.driftId,
      coordinationId: input.replayAttackResult.record.coordinationId,
      domain: "isolation" as const,
      severity: "critical" as const,
      createdAt: input.createdAt,
      deterministicHash: hashGovernanceDriftValue("isolation-violation", errorCodes),
    }),
  ]);
}

export function buildGovernanceDriftDetectionEngine(
  input: GovernanceDriftInput,
): GovernanceDriftResult {
  const authorityContract = buildGovernanceDriftAuthorityContract();
  const governance = analyzeGovernanceDrift(input);
  const replay = validateReplayDrift(input);
  const confidence = analyzeConfidenceDrift(input);
  const escalation = detectEscalationDrift(input);
  const dependency = validateDependencyDrift(input);
  const recommendation = analyzeRecommendationDrift(input);
  const containmentErrors = validateDriftContainment(input);
  const isolationErrors = validateDriftIsolation(input);
  const constitutionalErrors = validateConstitutionalDrift(input);

  const errors = Object.freeze([
    ...governance.errors,
    ...replay.errors,
    ...confidence.errors,
    ...escalation.errors,
    ...dependency.errors,
    ...recommendation.errors,
    ...containmentErrors,
    ...isolationErrors,
    ...constitutionalErrors,
  ]);

  const findings = correlateReplayDrift({
    driftInput: input,
    errors,
  });

  const dependencyLineage = buildGovernanceDriftDependencyLineage({
    dependencyLineageId: input.replayAttackResult.evidence.approvalConflictLineageId,
    dependencySafe: dependency.dependencySafe,
  });
  const replayLineage = buildGovernanceDriftReplayLineage({
    replayLedgerId: input.replayAttackResult.replayLedger[0]?.ledgerId ?? "empty-ledger",
    replayDeterministic: replay.replayDeterministic,
  });
  const escalationLineage = buildGovernanceDriftEscalationLineage({
    escalationLineageId: input.replayAttackResult.evidence.approvalConflictLineageId,
    escalationState: input.replayAttackResult.record.failClosed ? "frozen" : "elevated",
  });
  const topology = Object.freeze({
    topologyId: hashGovernanceDriftValue("topology-id", {
      driftId: input.driftId,
      dependencyLineageId: dependencyLineage.dependencyLineageId,
    }),
    dependencyLineageId: dependencyLineage.dependencyLineageId,
    topologyFrozen: !dependency.dependencySafe,
    topologyDriftDetected: !dependency.dependencySafe,
    topologyHash: hashGovernanceDriftValue("topology", {
      dependencyLineageId: dependencyLineage.dependencyLineageId,
      dependencySafe: dependency.dependencySafe,
    }),
  });

  const driftState = resolveGovernanceDriftState({
    errors,
    governanceLinked: governance.governanceLinked,
    replayDeterministic: replay.replayDeterministic,
    inheritedFailClosed: input.replayAttackResult.record.failClosed,
  });

  const replayInspection = inspectReplayDrift({
    replayId: input.replayAttackResult.record.replayAttackId,
    replayDeterministic: replay.replayDeterministic,
    replayState: input.replayAttackResult.record.replayAttackState,
    replayLedgerId: replayLineage.replayLedgerId,
  });
  const confidenceInspection = inspectConfidenceDrift({
    confidenceLinked: confidence.confidenceLinked,
    confidenceSafe: confidence.confidenceSafe,
  });
  const escalationInspection = inspectEscalationDrift({
    escalationId: input.replayAttackResult.record.replayAttackId,
    escalationState: escalationLineage.escalationState,
    escalationLineageId: escalationLineage.escalationLineageId,
  });
  const dependencyInspection = inspectDependencyDrift({
    dependencyLineageId: dependencyLineage.dependencyLineageId,
    dependencySafe: dependency.dependencySafe,
  });
  const recommendationInspection = inspectRecommendationDrift({
    recommendationId: input.replayAttackResult.record.recommendationId,
    recommendationState: input.replayAttackResult.record.failClosed ? "FAIL_CLOSED" : "SIMULATED",
    recommendationLinked: recommendation.recommendationLinked,
  });
  const boundaryInspection = inspectGovernanceDriftBoundary({
    topologyFrozen: topology.topologyFrozen,
    isolationSafe: isolationErrors.length === 0,
  });
  const driftInspection = inspectGovernanceDrift({
    driftId: input.driftId,
    coordinationId: input.replayAttackResult.record.coordinationId,
    driftState,
    categories: Object.freeze(findings.map((item) => item.category)),
  });

  const reasons = Object.freeze(errors.map((item) => item.code));
  const evidence = buildGovernanceDriftEvidence({
    driftInput: input,
    replayInspection,
    escalationInspection,
    recommendationInspection,
    boundaryInspection,
    reasons,
  });

  const lineageEntry: GovernanceDriftLineageEntry = Object.freeze({
    entryId: hashGovernanceDriftValue("lineage-entry-id", {
      driftId: input.driftId,
      createdAt: input.createdAt,
    }),
    driftId: input.driftId,
    coordinationId: input.replayAttackResult.record.coordinationId,
    driftState,
    categories: Object.freeze(findings.map((item) => item.category)),
    createdAt: input.createdAt,
    deterministicHash: hashGovernanceDriftValue("lineage-entry", {
      driftState,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendGovernanceDriftLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const lineageGraph = buildGovernanceDriftLineageGraph(lineage);
  const replayLedger = appendImmutableGovernanceDriftLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      driftId: input.driftId,
      replayAttackId: input.replayAttackResult.record.replayAttackId,
      driftState,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
    }),
    scope: "governance-drift-detection",
  });
  const auditLedger = appendGovernanceDriftAuditLedger({
    existing: replayLedger,
    payload: Object.freeze({
      driftId: input.driftId,
      driftState,
      findingCount: findings.length,
      lineageHash: lineage.lineageHash,
    }),
    scope: "governance-drift-audit",
  });

  const escalationRoute = routeGovernanceDriftEscalation({
    driftId: input.driftId,
    errors: reasons,
  });

  const violations = Object.freeze([
    ...buildIsolationViolations(input, reasons),
    ...errors.filter((item) => !item.code.includes("ISOLATION") && !item.code.includes("RUNTIME")).map((item) => Object.freeze({
      violationId: hashGovernanceDriftValue(`violation:${item.code}`, {
        driftId: input.driftId,
        code: item.code,
      }),
      driftId: input.driftId,
      coordinationId: input.replayAttackResult.record.coordinationId,
      domain: item.code.includes("GOVERNANCE")
        ? "governance"
        : item.code.includes("REPLAY")
          ? "replay"
          : item.code.includes("CONFIDENCE")
            ? "confidence"
            : item.code.includes("ESCALATION")
              ? "escalation"
              : item.code.includes("DEPENDENCY") || item.code.includes("TOPOLOGY")
                ? "dependency"
                : "recommendation",
      severity: "critical" as const,
      createdAt: input.createdAt,
      deterministicHash: hashGovernanceDriftValue(`violation-hash:${item.code}`, item),
    })),
  ] satisfies readonly GovernanceDriftViolation[]);

  const hashes = Object.freeze({
    lineageHash: lineage.lineageHash,
    replayHash: replayLineage.replayHash,
    governanceHash: hashGovernanceDriftValue("governance-hash", {
      governanceSnapshotId: input.replayAttackResult.record.governanceSnapshotId,
      governanceLinked: governance.governanceLinked,
    }),
    escalationHash: escalationLineage.escalationHash,
    dependencyHash: dependencyLineage.dependencyHash,
    recommendationHash: hashGovernanceDriftValue("recommendation-hash", {
      recommendationId: input.replayAttackResult.record.recommendationId,
      recommendationLinked: recommendation.recommendationLinked,
    }),
    evidenceHash: evidence.evidenceHash,
    deterministicHash: hashGovernanceDriftValue("hashes", {
      lineageHash: lineage.lineageHash,
      replayHash: replayLineage.replayHash,
      escalationHash: escalationLineage.escalationHash,
      dependencyHash: dependencyLineage.dependencyHash,
      evidenceHash: evidence.evidenceHash,
    }),
  });

  const record = Object.freeze({
    driftId: input.driftId,
    coordinationId: input.replayAttackResult.record.coordinationId,
    replayAttackId: input.replayAttackResult.record.replayAttackId,
    conflictId: input.replayAttackResult.record.conflictId,
    recommendationId: input.replayAttackResult.record.recommendationId,
    driftState,
    governanceSnapshotId: input.replayAttackResult.record.governanceSnapshotId,
    replaySnapshotId: input.replayAttackResult.record.replaySnapshotId,
    escalationSnapshotId: input.replayAttackResult.record.escalationSnapshotId,
    replaySafe: replay.replayDeterministic && governance.governanceLinked,
    failClosed: driftState === "FAIL_CLOSED",
    createdAt: input.createdAt,
  });

  const base = Object.freeze({
    record,
    authorityContract,
    findings,
    violations,
    lineage,
    lineageGraph,
    topology,
    replayLedger: auditLedger,
    evidence,
    hashes,
    driftInspection,
    replayInspection,
    confidenceInspection,
    escalationInspection,
    dependencyInspection,
    recommendationInspection,
    boundaryInspection,
    warnings: Object.freeze([
      "Governance drift detection remains observational, deterministic, replay-safe, and non-executing.",
      `escalation:${escalationRoute.escalationHash}`,
    ]),
    errors,
    derivedOnly: true as const,
  });

  return Object.freeze({
    ...base,
    deterministicHash: hashGovernanceDriftValue("result", base),
  });
}

export const detectGovernanceDrift = buildGovernanceDriftDetectionEngine;
