import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type { DiagnosticLineageResult, DiagnosticLineageType } from "./diagnosticLineage";

export type ReplayStatus = "CONSISTENT" | "PARTIAL" | "DRIFTED" | "FAILED";
export type ReplayTarget = "PROBE" | "SNAPSHOT" | "DIAGNOSTIC";

export type DriftReason = {
  category: string;
  expected?: string;
  actual?: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
};

export type ObservabilityReplayResult = {
  replayId: string;
  replayTarget: ReplayTarget;
  sourceLineageHash: string;
  reconstructedLineageHash: string;
  replayHash: string;
  replayStatus: ReplayStatus;
  completenessScore: number;
  evidenceRefs: string[];
  replayInputs: string[];
  driftReasons: DriftReason[];
  reconstructedAt: string;
  reconstructable: boolean;
  authority: "READ_ONLY";
  reasons: string[];
};

type ObservabilityReplayInput = {
  lineage: DiagnosticLineageResult;
  availableEvidenceRefs?: string[];
  optionalEvidenceRefs?: string[];
  reconstructedLineageHash?: string;
  reconstructedAt?: string;
};

function normalizeList(values: string[] | undefined) {
  return Array.from(new Set((values || []).map((value) => value.trim()).filter(Boolean))).sort();
}

function targetFromLineageType(lineageType: DiagnosticLineageType): ReplayTarget {
  if (lineageType === "PROBE") {
    return "PROBE";
  }
  if (lineageType === "SNAPSHOT") {
    return "SNAPSHOT";
  }
  return "DIAGNOSTIC";
}

function buildReplayHash(input: {
  replayTarget: ReplayTarget;
  sourceLineageHash: string;
  reconstructedLineageHash: string;
  replayInputs: string[];
  evidenceRefs: string[];
  parentLineageIds: string[];
}) {
  return hashPayloadDeterministically({
    replayTarget: input.replayTarget,
    sourceLineageHash: input.sourceLineageHash,
    reconstructedLineageHash: input.reconstructedLineageHash,
    replayInputs: input.replayInputs,
    evidenceRefs: input.evidenceRefs,
    parentLineageIds: input.parentLineageIds,
  });
}

function hasRequiredSnapshotEvidence(ref: string) {
  return ref.startsWith("contract:") || ref.startsWith("snapshot:");
}

function completenessScore(input: {
  replayTarget: ReplayTarget;
  lineageReconstructable: boolean;
  lineageMatched: boolean;
  missingCriticalEvidence: string[];
  missingOptionalEvidence: string[];
  expectedEvidenceCount: number;
  inputCount: number;
  parentCount: number;
}) {
  if (!input.lineageReconstructable) {
    return 0;
  }

  let score = 1;
  if (!input.lineageMatched) {
    score -= 0.35;
  }
  if (input.missingCriticalEvidence.length > 0) {
    score -= 0.6;
  }
  if (input.missingOptionalEvidence.length > 0) {
    score -= Math.min(0.2, input.missingOptionalEvidence.length * 0.1);
  }
  if (input.replayTarget !== "PROBE" && input.inputCount === 0) {
    score -= 0.25;
  }
  if (input.replayTarget === "DIAGNOSTIC" && input.parentCount === 0) {
    score -= 0.05;
  }
  if (input.expectedEvidenceCount === 0 && input.replayTarget !== "PROBE") {
    score -= 0.25;
  }

  return Math.max(0, Math.min(1, Number(score.toFixed(2))));
}

export function replayObservabilityLineage(input: ObservabilityReplayInput): ObservabilityReplayResult {
  const lineage = input.lineage;
  const replayTarget = targetFromLineageType(lineage.lineageType);
  const evidenceRefs = normalizeList(lineage.evidenceRefs);
  const availableEvidenceRefs = new Set(normalizeList(input.availableEvidenceRefs));
  const optionalEvidenceRefs = new Set(normalizeList(input.optionalEvidenceRefs));
  const replayInputs = normalizeList(lineage.sourceInputs);
  const reconstructedLineageHash = input.reconstructedLineageHash || lineage.lineageHash;
  const reasons: string[] = [];
  const driftReasons: DriftReason[] = [];

  if (replayTarget === "PROBE") {
    reasons.push("PROBE_REPLAY_MINIMAL");
  }
  if (replayTarget === "SNAPSHOT" && replayInputs.some((entry) => entry.startsWith("tenant:"))) {
    reasons.push("TENANT_SCOPE_PRESERVED");
  }
  if (replayTarget === "DIAGNOSTIC") {
    reasons.push("DIAGNOSTIC_REPLAY_READ_ONLY");
  }

  const lineageMatched = lineage.lineageHash === reconstructedLineageHash;
  if (!lineageMatched) {
    driftReasons.push({
      category: "lineage_mismatch",
      expected: lineage.lineageHash,
      actual: reconstructedLineageHash,
      severity: "HIGH",
      reason: "Reconstructed lineage hash does not match source lineage hash.",
    });
  }

  const requiredEvidence = evidenceRefs.filter((ref) => !optionalEvidenceRefs.has(ref));
  const missingCriticalEvidence = requiredEvidence.filter((ref) => !availableEvidenceRefs.has(ref) && (replayTarget === "SNAPSHOT" ? hasRequiredSnapshotEvidence(ref) : true));
  const missingOptionalEvidence = evidenceRefs.filter((ref) => optionalEvidenceRefs.has(ref) && !availableEvidenceRefs.has(ref));

  for (const ref of missingCriticalEvidence) {
    driftReasons.push({
      category: "missing_critical_evidence",
      expected: ref,
      severity: "HIGH",
      reason: "Required replay evidence was not available.",
    });
  }

  for (const ref of missingOptionalEvidence) {
    driftReasons.push({
      category: "missing_optional_evidence",
      expected: ref,
      severity: "LOW",
      reason: "Optional replay evidence was not available.",
    });
  }

  if (!lineage.reconstructable) {
    reasons.push("LINEAGE_NOT_RECONSTRUCTABLE_FAIL_SAFE");
  }

  const score = completenessScore({
    replayTarget,
    lineageReconstructable: lineage.reconstructable,
    lineageMatched,
    missingCriticalEvidence,
    missingOptionalEvidence,
    expectedEvidenceCount: evidenceRefs.length,
    inputCount: replayInputs.length,
    parentCount: lineage.parentLineageIds.length,
  });

  let replayStatus: ReplayStatus = "CONSISTENT";
  let reconstructable = lineage.reconstructable;
  if (!lineage.reconstructable || (replayTarget !== "PROBE" && replayInputs.length === 0) || missingCriticalEvidence.length > 0) {
    replayStatus = "FAILED";
    reconstructable = false;
  } else if (!lineageMatched) {
    replayStatus = "DRIFTED";
  } else if (missingOptionalEvidence.length > 0 || score < 1) {
    replayStatus = "PARTIAL";
  }

  const replayHash = buildReplayHash({
    replayTarget,
    sourceLineageHash: lineage.lineageHash,
    reconstructedLineageHash,
    replayInputs,
    evidenceRefs,
    parentLineageIds: lineage.parentLineageIds,
  });

  return {
    replayId: `observability-replay:${replayHash}`,
    replayTarget,
    sourceLineageHash: lineage.lineageHash,
    reconstructedLineageHash,
    replayHash,
    replayStatus,
    completenessScore: score,
    evidenceRefs,
    replayInputs,
    driftReasons,
    reconstructedAt: input.reconstructedAt || "UNKNOWN",
    reconstructable,
    authority: "READ_ONLY",
    reasons,
  };
}
