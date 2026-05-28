import type { CoordinationContainmentInput, CoordinationContainmentRecord, ContainmentLedgerEntry } from "@/types/coordination-containment";
import { buildContainmentAuthorityContract, createContainmentError, enforceOrchestrationBoundary } from "./orchestrationBoundaryEnforcer";
import { detectHiddenOrchestration } from "./hiddenOrchestrationDetector";
import { classifyRecursiveLoops } from "./recursiveLoopClassifier";
import { detectAuthorityExpansion } from "./authorityExpansionDetector";
import { blockRuntimeMutation } from "./runtimeMutationBlocker";
import { validateReplayContainment } from "./replayContainmentValidator";
import { validateAntiEmergence } from "./antiEmergenceValidator";
import { buildContainmentReplay } from "./containmentReplayBuilder";
import { appendContainmentLedger } from "./containmentLedger";
import { hashContainmentValue } from "./containmentHasher";
import { inspectContainmentDeterminism } from "./containmentDeterminismInspector";

export function buildCoordinationContainmentRecord(input: CoordinationContainmentInput): CoordinationContainmentRecord {
  const authorityContract = buildContainmentAuthorityContract();
  const boundaryErrors = enforceOrchestrationBoundary({
    authorityContract,
    metadata: input.metadata,
  });
  const hiddenMarkers = detectHiddenOrchestration(input.metadata);
  const recursion = classifyRecursiveLoops(input.missionGraph);
  const authorityMarkers = detectAuthorityExpansion({
    authorityContract,
    missionGraph: input.missionGraph,
    humanSupremacyRecord: input.humanSupremacyRecord,
    metadata: input.metadata,
  });
  const runtimeMarkers = blockRuntimeMutation(input.metadata);
  const replayErrors = validateReplayContainment(input);
  const validation = validateAntiEmergence({
    input,
    hiddenMarkers,
    recursiveMarkers: recursion.evidence,
    authorityMarkers,
    runtimeMarkers,
    replayErrors,
  });
  const replay = buildContainmentReplay(input);
  const partialHash = hashContainmentValue("coordination-containment-partial", {
    coordinationId: input.coordinationId,
    validation,
    replay,
  });
  const ledgerEntry: ContainmentLedgerEntry = Object.freeze({
    entryId: hashContainmentValue("containment-ledger-entry", {
      coordinationId: input.coordinationId,
      partialHash,
    }),
    coordinationId: input.coordinationId,
    containmentState: validation.containmentState,
    violationIds: Object.freeze(validation.violations.map((violation) => violation.violationId)),
    createdAt: input.createdAt,
    containmentHash: partialHash,
  });
  const ledger = appendContainmentLedger({
    existing: input.existingLedger,
    entry: ledgerEntry,
  });
  const record: CoordinationContainmentRecord = Object.freeze({
    coordinationId: input.coordinationId,
    authorityContract,
    validation,
    replay,
    ledger,
    warnings: Object.freeze([
      "Coordination containment remains validation-only and cannot mutate runtime or governance state.",
    ]),
    errors: Object.freeze([
      ...boundaryErrors,
      ...(validation.failClosed
        ? [createContainmentError(
          "CONTAINMENT_UNKNOWN_COORDINATION",
          "Containment failed closed because uncertainty increased restriction.",
          "validation.failClosed",
        )]
        : []),
    ]),
    containmentHash: "",
    derivedOnly: true as const,
  });
  const finalRecord = Object.freeze({
    ...record,
    containmentHash: hashContainmentValue("coordination-containment-record", {
      coordinationId: record.coordinationId,
      authorityContract: record.authorityContract,
      validation: record.validation,
      replay: record.replay,
      ledger: record.ledger,
    }),
  });
  const determinismErrors = inspectContainmentDeterminism(finalRecord);
  return Object.freeze({
    ...finalRecord,
    errors: Object.freeze([...finalRecord.errors, ...determinismErrors]),
  });
}

export const enforceCoordinationContainment = buildCoordinationContainmentRecord;
