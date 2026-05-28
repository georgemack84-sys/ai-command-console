import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { appendEvidenceAuditEntry, appendEvidenceLineage } from "./evidenceAppendOnlyLedger";
import { validateEvidenceAggregationBoundary } from "./evidenceAggregationBoundaryValidator";
import { buildEvidenceAggregationSession, hashEvidenceAggregationSession } from "./evidenceAggregationSessionManager";
import { coordinateEvidenceAggregationFreeze } from "./evidenceAggregationFreezeCoordinator";
import { validateEvidenceAggregationLifecycle } from "./evidenceAggregationLifecycleEngine";
import { buildEvidenceAncestryGraph } from "./evidenceAncestryGraph";
import { detectEvidenceAntiEmergence } from "./evidenceAntiEmergenceDetector";
import { buildEvidenceConflictLineage } from "./evidenceConflictLineageEngine";
import { detectEvidenceConflicts } from "./evidenceConflictDetector";
import { buildEvidenceConflictVisibility } from "./evidenceConflictVisibilityModel";
import { canonicalizeEvidenceToString } from "./evidenceCanonicalizer";
import { buildEvidenceDigestRegistry } from "./evidenceDigestRegistry";
import { shouldEvidenceFailClosed } from "./evidenceFailClosedController";
import { bindEvidenceGovernance } from "./evidenceGovernanceBinder";
import { buildEvidenceGovernanceTraceability } from "./evidenceGovernanceTraceabilityEngine";
import { validateEvidenceGovernance } from "./evidenceGovernanceValidator";
import { hashEvidenceValue } from "./evidenceHashEngine";
import { validateEvidenceHash } from "./evidenceHashValidator";
import { detectEvidenceHiddenExecution } from "./evidenceHiddenExecutionDetector";
import { validateEvidenceIntegrity } from "./evidenceIntegrityValidator";
import { buildEvidenceLineageEntries } from "./evidenceLineageEngine";
import { normalizeEvidenceReferences } from "./evidenceNormalizationPipeline";
import { buildEvidenceDeterministicOrdering } from "./evidenceDeterministicOrderingEngine";
import { detectEvidenceOrderingConflicts } from "./evidenceOrderingConflictDetector";
import { validateEvidenceOrdering } from "./evidenceOrderingValidator";
import { validateEvidenceOperatorAuthority } from "./evidenceOperatorAuthorityValidator";
import { reconstructEvidenceReplay } from "./evidenceReplayReconstructor";
import { detectEvidenceReplayDrift } from "./evidenceReplayDriftDetector";
import { buildEvidenceReplayLineage } from "./evidenceReplayLineageEngine";
import { validateEvidenceReplay } from "./evidenceReplayValidator";
import { buildEvidenceReferenceRegistry } from "./evidenceReferenceRegistry";
import { validateEvidenceReferences } from "./evidenceReferenceValidator";
import { correlateEvidenceSources } from "./evidenceSourceCorrelator";
import { validateEvidenceSerialization } from "./evidenceSerializationValidator";
import type {
  EvidenceAggregationAuditRecord,
  EvidenceAggregationError,
  EvidenceAggregationInput,
  EvidenceAggregationResult,
  EvidenceAggregationStageRecord,
  EvidenceConflictRecord,
} from "./types/evidenceAggregationTypes";

function freezeErrors(errors: readonly EvidenceAggregationError[]): readonly EvidenceAggregationError[] {
  return Object.freeze([...errors]);
}

function buildStages(errors: readonly EvidenceAggregationError[]): readonly EvidenceAggregationStageRecord[] {
  const reasons = Object.freeze(errors.map((error) => error.code));
  return Object.freeze([
    "session_start",
    "boundary_validation",
    "evidence_normalization",
    "deterministic_ordering",
    "governance_binding",
    "replay_binding",
    "conflict_detection",
    "lineage_recording",
    "audit_binding",
    "session_completion",
  ].map((stage) => Object.freeze({
    stage,
    passed: errors.length === 0,
    reasons,
    deterministicHash: hashEvidenceValue("evidence-stage", { stage, reasons }),
  })));
}

function buildAuditRecord(input: {
  aggregationSessionId: string;
  evidenceCount: number;
  lineageHash: string;
  sessionHash: string;
}): EvidenceAggregationAuditRecord {
  return Object.freeze({
    recordId: `${input.aggregationSessionId}:audit`,
    aggregationSessionId: input.aggregationSessionId,
    evidenceCount: input.evidenceCount,
    lineageHash: input.lineageHash,
    auditHash: hashEvidenceValue("evidence-audit-record", input),
  });
}

export function aggregateEvidence(
  input: EvidenceAggregationInput,
): EvidenceAggregationResult {
  const boundaryErrors = validateEvidenceAggregationBoundary(input);
  const lifecycleErrors = validateEvidenceAggregationLifecycle()
    ? []
    : [{
        code: "EVIDENCE_AGGREGATION_INVALID_INPUT" as const,
        message: "Evidence aggregation lifecycle is not declared.",
        path: "evidenceAggregationPipeline",
      }];

  const rawReferences = correlateEvidenceSources(input);
  const normalizedReferences = normalizeEvidenceReferences(rawReferences);
  const orderingErrors = [
    ...validateEvidenceOrdering(normalizedReferences),
    ...detectEvidenceOrderingConflicts(normalizedReferences),
  ];
  const ordered = buildEvidenceDeterministicOrdering(normalizedReferences).ordered;
  const governanceRecord = bindEvidenceGovernance(input);
  const governanceErrors = validateEvidenceGovernance({
    aggregationInput: input,
    references: ordered,
  });
  const replayRecord = reconstructEvidenceReplay(input);
  const replayErrors = [
    ...validateEvidenceReplay(input),
    ...detectEvidenceReplayDrift(input),
  ];
  const conflicts = detectEvidenceConflicts(ordered);
  const conflictVisibility = buildEvidenceConflictVisibility(conflicts);
  const integrity = validateEvidenceIntegrity(input);
  const hiddenExecutionErrors = detectEvidenceHiddenExecution(input);
  const antiEmergenceErrors = detectEvidenceAntiEmergence(input);
  const operatorErrors = validateEvidenceOperatorAuthority(input);
  const referenceErrors = validateEvidenceReferences(ordered);
  const digestRegistry = buildEvidenceDigestRegistry(ordered);
  const referenceRegistry = buildEvidenceReferenceRegistry(ordered);
  const ancestryGraph = buildEvidenceAncestryGraph(ordered);
  const lineageEntries = buildEvidenceLineageEntries({
    aggregationInput: input,
    references: ordered,
  });
  const lineage = appendEvidenceLineage({
    existing: input.existingLineage,
    entries: lineageEntries,
  });

  const serializationErrors = validateEvidenceSerialization({
    value: ordered,
    expectedCanonical: canonicalizeEvidenceToString(ordered),
    path: "evidenceReferences",
  });

  const hashErrors = ordered.flatMap((reference) => {
    const { canonicalHash: _ignoredCanonicalHash, ...rehashableReference } = reference;
    return validateEvidenceHash({
      scope: "evidence-canonical",
      value: rehashableReference,
      expectedHash: reference.canonicalHash,
      path: `evidenceReferences.${reference.evidenceId}.canonicalHash`,
    });
  });

  const conflictErrors: EvidenceAggregationError[] = conflicts.length > 0
    ? [{
        code: "EVIDENCE_AGGREGATION_UNRESOLVED_CONFLICT",
        message: "Conflicting evidence remains visible and unresolved.",
        path: "conflicts",
      }]
    : [];

  const auditLedgerChainErrors = verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])])
    ? []
    : [{
        code: "EVIDENCE_AGGREGATION_MISSING_LINEAGE" as const,
        message: "Existing append-only audit ledger chain is invalid.",
        path: "existingAuditLedger",
      }];

  const timestampErrors = ordered.some((reference) => !reference.collectedAt)
    ? [{
        code: "EVIDENCE_AGGREGATION_TIMESTAMP_INCONSISTENCY" as const,
        message: "All evidence references require deterministic timestamps.",
        path: "evidenceReferences.collectedAt",
      }]
    : [];

  const errors = freezeErrors([
    ...boundaryErrors,
    ...lifecycleErrors,
    ...orderingErrors,
    ...governanceErrors,
    ...replayErrors,
    ...integrity.errors,
    ...hiddenExecutionErrors,
    ...antiEmergenceErrors,
    ...operatorErrors,
    ...referenceErrors,
    ...serializationErrors,
    ...hashErrors,
    ...conflictErrors,
    ...auditLedgerChainErrors,
    ...timestampErrors,
  ]);

  const freeze = coordinateEvidenceAggregationFreeze(errors);
  const failClosed = shouldEvidenceFailClosed(errors);
  const sessionHash = hashEvidenceAggregationSession(
    buildEvidenceAggregationSession({
      aggregationSessionId: input.aggregationSessionId,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      status: failClosed ? "frozen" : "completed",
      evidenceReferences: ordered.map((reference) => reference.evidenceId),
      governanceSnapshotId: governanceRecord.governanceSnapshotId,
      replaySessionId: replayRecord.replaySessionId,
      integrityStatus: integrity.record.integrityStatus,
      canonicalAggregationHash: hashEvidenceValue("evidence-aggregation-canonical", {
        orderedIds: ordered.map((reference) => reference.evidenceId),
        orderingHash: buildEvidenceDeterministicOrdering(ordered).orderingHash,
        replayHash: replayRecord.replayHash,
        governanceHash: governanceRecord.governanceHash,
        digestKeys: Object.keys(digestRegistry).sort(),
        referenceKeys: Object.keys(referenceRegistry).sort(),
      }),
    }),
  );

  const session = buildEvidenceAggregationSession({
    aggregationSessionId: input.aggregationSessionId,
    startedAt: input.startedAt,
    completedAt: input.completedAt ?? input.startedAt,
    status: failClosed ? "frozen" : "completed",
    evidenceReferences: ordered.map((reference) => reference.evidenceId),
    governanceSnapshotId: governanceRecord.governanceSnapshotId,
    replaySessionId: replayRecord.replaySessionId,
    integrityStatus: integrity.record.integrityStatus,
    canonicalAggregationHash: sessionHash,
  });

  const auditRecord = buildAuditRecord({
    aggregationSessionId: input.aggregationSessionId,
    evidenceCount: ordered.length,
    lineageHash: lineage.lineageHash,
    sessionHash,
  });

  const auditLedger = appendEvidenceAuditEntry({
    existing: appendEvidenceAuditEntry({
      existing: input.existingAuditLedger,
      payload: Object.freeze({
        event: "evidence.aggregation.started",
        aggregationSessionId: input.aggregationSessionId,
        replayHash: replayRecord.replayHash,
      }),
      scope: "evidence-aggregation",
    }),
    payload: Object.freeze({
      event: failClosed ? "evidence.aggregation.frozen" : "evidence.aggregation.completed",
      aggregationSessionId: input.aggregationSessionId,
      evidenceCount: ordered.length,
      lineageHash: lineage.lineageHash,
      auditHash: auditRecord.auditHash,
      conflictLineageHash: buildEvidenceConflictLineage(conflicts),
      replayLineageHash: buildEvidenceReplayLineage(replayRecord),
      governanceTraceabilityHash: buildEvidenceGovernanceTraceability({
        governanceRecord,
        references: ordered,
      }),
    }),
    scope: "evidence-aggregation-audit",
  });

  return Object.freeze({
    session,
    evidenceReferences: failClosed ? Object.freeze([]) : ordered,
    replayRecord,
    governanceRecord,
    integrityRecord: integrity.record,
    conflicts: failClosed ? conflicts : conflicts,
    conflictVisibility,
    ancestryGraph,
    freeze,
    auditRecord,
    lineage,
    auditLedger,
    stages: buildStages(errors),
    errors,
    warnings: Object.freeze(
      failClosed
        ? ["Evidence aggregation froze under constitutional uncertainty."]
        : ["Evidence aggregation remained deterministic, replay-safe, and non-mutating."],
    ),
    deterministicHash: hashEvidenceValue("evidence-aggregation-result", {
      sessionHash,
      evidenceIds: ordered.map((reference) => reference.evidenceId),
      replayHash: replayRecord.replayHash,
      governanceHash: governanceRecord.governanceHash,
      lineageHash: lineage.lineageHash,
      auditHash: auditRecord.auditHash,
      freezeHash: freeze.freezeHash,
      errorCodes: errors.map((error) => error.code),
    }),
    derivedOnly: true as const,
  });
}

export const buildEvidenceAggregationEngine = aggregateEvidence;
