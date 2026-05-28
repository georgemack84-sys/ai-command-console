import { buildAuditArtifact } from "./audit-artifact-builder";
import { hashAuditArtifact } from "./audit-artifact-hasher";
import { buildAuditLedgerEvents } from "./audit-ledger-event-builder";
import { buildCompatibilityHashReference } from "./compatibility-hash-linker";
import { detectCompatibilityDrift } from "./compatibility-drift-detector";
import { ingestCompatibilitySnapshot } from "./compatibility-snapshot-ingestor";
import { validateCompatibilityTruth } from "./compatibility-truth-validator";
import { buildEvidenceReference } from "./evidence-reference-builder";
import { createReplayAuditFailure } from "./replay-audit-errors";
import { buildReplayInputSnapshot, derivePlanHash } from "./replay-input-snapshot";
import { hashReplayInputSnapshot } from "./replay-input-hasher";
import { buildReplayProof, hashReplayProof } from "./replay-proof-generator";
import { validateReplayProof } from "./replay-proof-validator";
import type { ReplayAuditInput, ReplayAuditResult } from "./replay-audit-types";

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        deepFreeze(item);
      }
    } else {
      for (const nested of Object.values(value)) {
        deepFreeze(nested);
      }
    }
  }
  return value as Readonly<T>;
}

export function buildReplayAuditReadiness(input: ReplayAuditInput): ReplayAuditResult {
  const planHash = derivePlanHash(input);
  const normalizedPlanHash = input.normalizedPlan.normalizationHash;

  const ingested = ingestCompatibilitySnapshot(input.executionCompatibilityContract);
  const truthFailures = ingested.compatibilitySnapshotHash
    ? validateCompatibilityTruth(input, ingested.compatibilitySnapshotHash)
    : [];
  const driftFailures = detectCompatibilityDrift(input);
  const failures = [...ingested.failures, ...truthFailures, ...driftFailures];

  if (failures.length > 0 || !ingested.compatibilityReference || !ingested.compatibilitySnapshotHash) {
    return deepFreeze({
      verdict: "REPLAY_AUDIT_BLOCKED",
      planId: input.normalizedPlan.planId,
      planHash,
      normalizedPlanHash,
      executionTruthHash: input.executionTruthPackage.executionTruthHash,
      executionCompatibilityHash: input.executionCompatibilityContract.executionCompatibilityHash,
      compatibilitySnapshotHash: ingested.compatibilitySnapshotHash,
      failures,
    });
  }

  const compatibilityReference = buildCompatibilityHashReference(
    input.executionCompatibilityContract,
    ingested.compatibilitySnapshotHash,
  );
  const replayInputSnapshot = buildReplayInputSnapshot(input, planHash, ingested.compatibilitySnapshotHash);
  const replaySnapshotHash = hashReplayInputSnapshot(replayInputSnapshot);
  const replayedSnapshotHash = hashReplayInputSnapshot(buildReplayInputSnapshot(input, planHash, ingested.compatibilitySnapshotHash));
  if (replaySnapshotHash !== replayedSnapshotHash) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_REPLAY_SNAPSHOT_HASH_MISMATCH",
      "Replay snapshot hash drift detected.",
      "replaySnapshotHash",
    ));
  }

  const replayProof = buildReplayProof({
    replayAuditInput: input,
    originalReplaySnapshotHash: replaySnapshotHash,
    replayedReplaySnapshotHash: replayedSnapshotHash,
  });
  const replayProofFailures = validateReplayProof(replayProof);
  failures.push(...replayProofFailures);
  const replayProofHash = hashReplayProof(replayProof);

  const bareAuditArtifact = buildAuditArtifact({
    planId: input.normalizedPlan.planId,
    planHash,
    normalizedPlanHash,
    executionTruthHash: compatibilityReference.executionTruthHash,
    executionCompatibilityHash: compatibilityReference.executionCompatibilityHash,
    compatibilitySnapshotHash: compatibilityReference.compatibilitySnapshotHash,
    replaySnapshotHash,
    replayProofHash,
  });
  const auditArtifactHash = hashAuditArtifact(bareAuditArtifact);
  const auditArtifact = {
    ...bareAuditArtifact,
    artifactHash: auditArtifactHash,
  };
  if (hashAuditArtifact(bareAuditArtifact) !== auditArtifact.artifactHash) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_AUDIT_ARTIFACT_HASH_MISMATCH",
      "Audit artifact hash drift detected.",
      "auditArtifact.artifactHash",
    ));
  }

  const ledgerEvents = buildAuditLedgerEvents({
    planId: input.normalizedPlan.planId,
    planHash,
    executionTruthHash: compatibilityReference.executionTruthHash,
    executionCompatibilityHash: compatibilityReference.executionCompatibilityHash,
    compatibilitySnapshotHash: compatibilityReference.compatibilitySnapshotHash,
    replaySnapshotHash,
    replayProofHash,
    auditArtifactHash,
  });
  for (let index = 1; index < ledgerEvents.length; index += 1) {
    if (ledgerEvents[index]!.previousEventHash !== ledgerEvents[index - 1]!.eventHash) {
      failures.push(createReplayAuditFailure(
        "PHASE4_2H_LEDGER_EVENT_HASH_MISMATCH",
        "Ledger event chain is not append-only compatible.",
        `ledgerEvents[${index}]`,
      ));
      break;
    }
  }

  const evidenceReferenceBuilt = buildEvidenceReference({
    referenceVersion: "4.2H",
    planId: input.normalizedPlan.planId,
    planHash,
    normalizedPlanHash,
    executionTruthHash: compatibilityReference.executionTruthHash,
    executionCompatibilityHash: compatibilityReference.executionCompatibilityHash,
    compatibilitySnapshotHash: compatibilityReference.compatibilitySnapshotHash,
    replaySnapshotHash,
    replayProofHash,
    auditArtifactHash,
    ledgerEventHashes: ledgerEvents.map((event) => event.eventHash),
  });
  if (!evidenceReferenceBuilt.reference.ledgerEventHashes.every((hash) => typeof hash === "string")) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_EVIDENCE_REFERENCE_HASH_MISMATCH",
      "Evidence reference must contain immutable hash links only.",
      "evidenceReference.ledgerEventHashes",
    ));
  }

  const artifacts = deepFreeze({
    compatibilityReference,
    replayInputSnapshot,
    replaySnapshotHash,
    replayProof,
    replayProofHash,
    auditArtifact,
    ledgerEvents,
    evidenceReference: evidenceReferenceBuilt.reference,
    evidenceReferenceHash: evidenceReferenceBuilt.referenceHash,
  });

  return deepFreeze({
    verdict: failures.length === 0 ? "REPLAY_AUDIT_READY" : "REPLAY_AUDIT_BLOCKED",
    planId: input.normalizedPlan.planId,
    planHash,
    normalizedPlanHash,
    executionTruthHash: compatibilityReference.executionTruthHash,
    executionCompatibilityHash: compatibilityReference.executionCompatibilityHash,
    compatibilitySnapshotHash: compatibilityReference.compatibilitySnapshotHash,
    replaySnapshotHash,
    replayProofHash,
    auditArtifactHash,
    evidenceReferenceHash: evidenceReferenceBuilt.referenceHash,
    failures,
    artifacts,
  });
}
