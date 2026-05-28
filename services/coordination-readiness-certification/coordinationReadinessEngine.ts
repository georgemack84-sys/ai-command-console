import type {
  CertificationLineageEntry,
  CoordinationReadinessAuthorityContract,
  CoordinationReadinessCertificationInput,
  CoordinationReadinessCertificationResult,
  CoordinationReadinessViolation,
} from "@/types/coordination-readiness-certification";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";
import { validateReplayCertification } from "./replayCertificationValidator";
import { certifyGovernanceLineage } from "./governanceLineageCertifier";
import { certifyEscalationLineage } from "./escalationLineageCertifier";
import { validateApprovalTraceability } from "./approvalTraceabilityValidator";
import { validateOrchestrationCeiling } from "./orchestrationCeilingValidator";
import { certifyHiddenExecutionAbsence } from "./hiddenExecutionCertifier";
import { certifyRecursiveOrchestrationAbsence } from "./recursiveOrchestrationCertifier";
import { certifyAuthorityExpansionAbsence } from "./authorityExpansionCertifier";
import { validateCertificationConsistency } from "./certificationConsistencyValidator";
import { resolveCoordinationReadinessState } from "./failClosedCertificationEngine";
import { shouldFreezeCertification } from "./certificationFreezeCoordinator";
import { buildCertificationEvidence } from "./certificationEvidenceBuilder";
import { appendCertificationLineage } from "@/services/certification-lineage/certificationLineageEngine";
import { appendCertificationReplayLedger } from "@/services/certification-lineage/certificationReplayLedger";
import { inspectCertification } from "@/services/certification-visibility/certificationInspector";
import { inspectReplayCertification } from "@/services/certification-visibility/replayCertificationInspector";
import { inspectGovernanceCertification } from "@/services/certification-visibility/governanceCertificationInspector";
import { inspectEscalationCertification } from "@/services/certification-visibility/escalationCertificationInspector";
import { inspectBoundaryCertification } from "@/services/certification-visibility/boundaryCertificationInspector";
import { buildImmutableCertificationAuditLog } from "@/services/certification-lineage/immutableCertificationAuditLog";

function buildAuthorityContract(): CoordinationReadinessAuthorityContract {
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

export function buildCoordinationReadinessCertification(
  input: CoordinationReadinessCertificationInput,
): CoordinationReadinessCertificationResult {
  const authorityContract = buildAuthorityContract();
  const replay = validateReplayCertification(input);
  const governance = certifyGovernanceLineage(input);
  const escalation = certifyEscalationLineage(input);
  const approval = validateApprovalTraceability(input);
  const orchestration = validateOrchestrationCeiling(input);
  const execution = certifyHiddenExecutionAbsence(input);
  const recursive = certifyRecursiveOrchestrationAbsence(input);
  const authority = certifyAuthorityExpansionAbsence(input);
  const consistencyErrors = validateCertificationConsistency(input);

  const errors = Object.freeze([
    ...replay.errors,
    ...governance.errors,
    ...escalation.errors,
    ...approval.errors,
    ...orchestration.errors,
    ...execution.errors,
    ...recursive.errors,
    ...authority.errors,
    ...consistencyErrors,
  ]);

  const violations = Object.freeze([
    ...replay.violations,
    ...governance.violations,
    ...escalation.violations,
    ...approval.violations,
    ...orchestration.violations,
    ...execution.violations,
    ...recursive.violations,
    ...authority.violations,
  ] satisfies readonly CoordinationReadinessViolation[]);

  const replayInspection = inspectReplayCertification(input.coordinationReplay);
  const governanceInspection = inspectGovernanceCertification(input);
  const escalationInspection = inspectEscalationCertification(input.escalationResult);
  const boundaryInspection = inspectBoundaryCertification(input.boundaryResult);

  const certificationState = resolveCoordinationReadinessState({
    errors,
    replaySafe: replay.replayDeterministic,
    governanceLinked: governance.governanceLinked,
  });
  const freezeRequired = shouldFreezeCertification({
    certificationState,
    inheritedBoundaryFailClosed: input.boundaryResult.record.failClosed,
    inheritedContainmentState: input.orchestrationRecord.containment.inheritedState,
  });

  const reasons = Object.freeze([
    ...errors.map((item) => item.code),
    ...(freezeRequired ? ["certification:freeze-required"] : []),
  ]);

  const evidence = buildCertificationEvidence({
    certificationInput: input,
    replayInspection,
    governanceInspection,
    escalationInspection,
    boundaryInspection,
    reasons,
  });

  const lineageEntry: CertificationLineageEntry = Object.freeze({
    entryId: hashCoordinationReplayValue("coordination-readiness-lineage-entry-id", {
      certificationId: input.certificationId,
      coordinationId: input.coordinationRecord.coordinationId,
      createdAt: input.createdAt,
    }),
    certificationId: input.certificationId,
    coordinationId: input.coordinationRecord.coordinationId,
    certificationState,
    createdAt: input.createdAt,
    deterministicHash: hashCoordinationReplayValue("coordination-readiness-lineage-entry", {
      certificationState,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendCertificationLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const replayLedger = appendCertificationReplayLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      certificationId: input.certificationId,
      coordinationId: input.coordinationRecord.coordinationId,
      certificationState,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
    }),
    scope: "coordination-readiness-certification",
  });
  const certificationInspection = inspectCertification({
    certificationId: input.certificationId,
    coordinationId: input.coordinationRecord.coordinationId,
    certificationState,
    verdicts: reasons,
  });
  const auditLog = buildImmutableCertificationAuditLog({
    certificationInput: input,
    evidence,
    certificationState,
  });

  const record = Object.freeze({
    certificationId: input.certificationId,
    coordinationId: input.coordinationRecord.coordinationId,
    certificationState: freezeRequired ? "FAIL_CLOSED" : certificationState,
    governanceSnapshotId: input.coordinationRecord.governanceSnapshotId,
    replaySnapshotId: input.coordinationRecord.replaySnapshotId,
    escalationSnapshotId: input.coordinationRecord.escalationSnapshotId,
    replaySafe: replay.replayDeterministic && !errors.some((item) => item.code.includes("REPLAY")),
    failClosed: freezeRequired || certificationState === "FAIL_CLOSED",
    createdAt: input.createdAt,
  });

  const base = Object.freeze({
    record,
    authorityContract,
    violations,
    lineage,
    replayLedger,
    evidence,
    certificationInspection,
    replayInspection,
    governanceInspection,
    escalationInspection,
    boundaryInspection,
    warnings: Object.freeze([
      "Coordination readiness certification remains deterministic, replay-safe, governance-bound, and non-executing.",
      `audit:${auditLog.auditId}`,
    ]),
    errors,
    derivedOnly: true as const,
  });

  return Object.freeze({
    ...base,
    deterministicHash: hashCoordinationReplayValue("coordination-readiness-certification-result", base),
  });
}

export const certifyCoordinationReadiness = buildCoordinationReadinessCertification;
