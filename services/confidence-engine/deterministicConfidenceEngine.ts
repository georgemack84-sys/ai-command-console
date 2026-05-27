import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { appendConfidenceAuditEntry, buildConfidenceAuditEntry } from "./confidenceAuditBridge";
import { canonicalizeConfidenceToString } from "./confidenceCanonicalizer";
import { classifyDeterministicConfidence } from "./confidenceClassificationEngine";
import { resolveConfidenceCautionLevel } from "./confidenceCautionEngine";
import { certifyConfidenceDeterminism } from "./confidenceDeterminismCertifier";
import { validateConfidenceDrift } from "./confidenceDriftValidator";
import { validateConfidenceEvidence } from "./confidenceEvidenceValidator";
import { resolveConfidenceStatus } from "./confidenceFailClosedGuard";
import { applyConfidenceGovernanceAdjustment } from "./confidenceGovernanceAdjuster";
import { hashConfidenceValue } from "./confidenceHashEngine";
import { validateConfidenceIntegrity } from "./confidenceIntegrityValidator";
import { buildConfidenceLineage } from "./confidenceLineageRegistry";
import { normalizeConfidenceScore } from "./confidenceNormalizationEngine";
import { validateConfidencePolicy } from "./confidencePolicyValidator";
import { validateConfidenceProposal } from "./confidenceProposalValidator";
import { buildConfidenceReplayBinding } from "./confidenceReplayBindings";
import { auditConfidenceReplayLineage } from "./confidenceReplayAuditor";
import { validateConfidenceReplay } from "./confidenceReplayValidator";
import { loadConfidenceSnapshots } from "./confidenceSnapshotLoader";
import { resolveConfidenceVersions } from "./confidenceVersionRegistry";
import { buildConfidenceFactor, getConfidenceWeights } from "./confidenceWeightEngine";
import type {
  ConfidenceAuditEntry,
  ConfidenceFactorRecord,
  DeterministicConfidenceError,
  DeterministicConfidenceInput,
  DeterministicConfidenceResult,
  DeterministicConfidenceScore,
  DeterministicConfidenceStageRecord,
} from "./types/confidenceTypes";

function buildStages(errors: readonly DeterministicConfidenceError[]): readonly DeterministicConfidenceStageRecord[] {
  const reasons = Object.freeze(errors.map((error) => error.code));

  return Object.freeze([
    "snapshot_loading",
    "version_resolution",
    "evidence_validation",
    "policy_validation",
    "proposal_validation",
    "integrity_validation",
    "factor_weighting",
    "classification",
    "governance_adjustment",
    "determinism_certification",
    "replay_validation",
    "audit_append",
  ].map((stage) => Object.freeze({
    stage,
    passed: errors.length === 0,
    reasons,
    deterministicHash: hashConfidenceValue("confidence-stage", { stage, reasons }),
  })));
}

function mapProposalIntegrityScore(status: DeterministicConfidenceInput["proposalIntegrityResult"]["status"]): number {
  switch (status) {
    case "sealed":
    case "replay_verified":
      return 1;
    case "draft":
    case "validating":
      return 0.7;
    case "superseded":
      return 0.45;
    case "frozen":
      return 0.3;
    case "revoked":
      return 0.15;
    case "replay_failed":
      return 0.05;
  }
}

function buildFactors(input: {
  engineInput: DeterministicConfidenceInput;
  versionsValid: boolean;
  auditConsistent: boolean;
}): readonly ConfidenceFactorRecord[] {
  const proposal = input.engineInput.proposalIntegrityResult.proposal;
  const evidenceCount = input.engineInput.proposalIntegrityResult.evidence.evidenceRefs.length;
  const approvalCount = Math.max(1, input.engineInput.proposalApprovalBindingResult.binding.approvalIds.length);
  const replayCertified = input.engineInput.proposalReplayResult.certification.certified
    && input.engineInput.proposalReplayResult.replay.deterministic;
  const governanceBound = input.engineInput.proposalGovernanceBindingResult.status === "BOUND";
  const policyStable = !input.engineInput.proposalGovernanceBindingResult.approvalRequirementBinding.escalationRequired;
  const weights = getConfidenceWeights();
  void weights;

  return Object.freeze([
    buildConfidenceFactor({
      factorType: "evidence_quality",
      score: Math.min(1, evidenceCount / 4),
      reason: "Evidence quality is derived from immutable evidence reference density.",
    }),
    buildConfidenceFactor({
      factorType: "evidence_completeness",
      score: Math.min(1, evidenceCount / approvalCount),
      reason: "Evidence completeness is bound to immutable approval dependency coverage.",
    }),
    buildConfidenceFactor({
      factorType: "replay_consistency",
      score: replayCertified ? 1 : 0.25,
      reason: "Replay consistency is bounded by replay certification and deterministic lineage.",
    }),
    buildConfidenceFactor({
      factorType: "governance_alignment",
      score: governanceBound ? 1 : 0.3,
      reason: "Governance alignment reflects immutable governance binding status.",
    }),
    buildConfidenceFactor({
      factorType: "policy_stability",
      score: policyStable ? 0.95 : 0.65,
      reason: "Policy stability is constrained by immutable approval requirement escalation settings.",
    }),
    buildConfidenceFactor({
      factorType: "proposal_integrity",
      score: mapProposalIntegrityScore(input.engineInput.proposalIntegrityResult.status),
      reason: "Proposal integrity is bound to immutable proposal integrity status.",
    }),
    buildConfidenceFactor({
      factorType: "audit_consistency",
      score: input.auditConsistent ? 1 : 0,
      reason: "Audit consistency reflects append-only immutable audit chain validity.",
    }),
    buildConfidenceFactor({
      factorType: "model_validity",
      score: input.versionsValid ? 1 : 0,
      reason: "Model validity requires registered scoring, weight, and normalization versions.",
    }),
  ]);
}

function buildAuditEntries(input: {
  score: DeterministicConfidenceScore;
  status: DeterministicConfidenceResult["status"];
  generatedAt: string;
}): readonly ConfidenceAuditEntry[] {
  const eventTypes = [
    "CONFIDENCE_GENERATED",
    "CONFIDENCE_CLASSIFIED",
    "CONFIDENCE_ADJUSTED",
    "CONFIDENCE_REPLAYED",
  ] as const;

  const extra = input.status === "COMPLETED"
    ? ["CONFIDENCE_REPLAY_VALIDATED"] as const
    : input.status === "FROZEN"
      ? ["CONFIDENCE_FROZEN"] as const
      : ["CONFIDENCE_REPLAY_FAILED", "CONFIDENCE_REJECTED"] as const;

  return Object.freeze([...eventTypes, ...extra].map((eventType, index) => buildConfidenceAuditEntry({
    confidenceId: input.score.confidenceId,
    proposalId: input.score.proposalId,
    eventType,
    timestamp: input.generatedAt,
    inputHash: hashConfidenceValue("confidence-audit-input", {
      confidenceId: input.score.confidenceId,
      eventType,
      index,
    }),
    outputHash: input.score.outputHash,
  })));
}

export function scoreDeterministicConfidence(
  input: DeterministicConfidenceInput,
): DeterministicConfidenceResult {
  const errors: DeterministicConfidenceError[] = [];

  const auditConsistent = verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])]);
  if (!auditConsistent) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_FAIL_CLOSED",
      message: "Existing confidence audit ledger is not append-only valid.",
      path: "existingAuditLedger",
    });
  }

  const snapshotLoad = loadConfidenceSnapshots(input);
  const versionLoad = resolveConfidenceVersions(input);
  errors.push(
    ...snapshotLoad.errors,
    ...versionLoad.errors,
    ...validateConfidenceEvidence(input),
    ...validateConfidencePolicy(input),
    ...validateConfidenceProposal(input),
    ...validateConfidenceIntegrity(input),
  );

  const factors = buildFactors({
    engineInput: input,
    versionsValid: versionLoad.errors.length === 0,
    auditConsistent,
  });

  const rawScore = Number(factors.reduce((sum, factor) => sum + factor.weightedScore, 0).toFixed(3));
  const adjustedScore = applyConfidenceGovernanceAdjustment({
    rawScore: normalizeConfidenceScore(rawScore),
    engineInput: input,
  });
  const classification = classifyDeterministicConfidence(adjustedScore);
  const cautionLevel = resolveConfidenceCautionLevel(classification);

  const scoreCore = {
    confidenceId: `confidence:${input.proposalIntegrityResult.proposal.proposalId}:${input.confidenceRunId}`,
    proposalId: input.proposalIntegrityResult.proposal.proposalId,
    recommendationId: input.recommendationId,
    score: adjustedScore,
    classification,
    cautionLevel,
    evidenceSnapshotId: snapshotLoad.snapshotBundle.evidenceSnapshotId,
    governanceSnapshotId: snapshotLoad.snapshotBundle.governanceSnapshotId,
    policyLineageId: snapshotLoad.snapshotBundle.policyLineageId,
    proposalLineageId: snapshotLoad.snapshotBundle.proposalLineageId,
    replayLineageId: snapshotLoad.snapshotBundle.replayLineageId,
    scoringModelVersion: versionLoad.versions.scoringModelVersion,
    weightTableVersion: versionLoad.versions.weightTableVersion,
    normalizationVersion: versionLoad.versions.normalizationVersion,
    generatedAt: input.generatedAt,
    authorityGranted: false as const,
    executionPermitted: false as const,
  };

  const inputHash = hashConfidenceValue("deterministic-confidence-input", {
    snapshotHash: snapshotLoad.snapshotBundle.snapshotHash,
    versionHash: versionLoad.versions.versionHash,
    factorHashes: factors.map((factor) => factor.deterministicHash),
  });

  const provisionalScore = Object.freeze({
    ...scoreCore,
    inputHash,
    outputHash: "",
    lineageHash: "",
  } satisfies DeterministicConfidenceScore);

  const lineage = buildConfidenceLineage({
    engineInput: input,
    score: provisionalScore,
  });
  errors.push(...auditConfidenceReplayLineage(lineage));

  const outputHash = hashConfidenceValue("deterministic-confidence-output", canonicalizeConfidenceToString({
    ...scoreCore,
    inputHash,
    lineageHash: lineage.lineageHash,
  }));

  const score = Object.freeze({
    ...scoreCore,
    inputHash,
    outputHash,
    lineageHash: lineage.lineageHash,
  } satisfies DeterministicConfidenceScore);

  const certification = certifyConfidenceDeterminism({
    score,
    lineage,
    governanceAdjustedScore: adjustedScore,
  });

  const replayBinding = buildConfidenceReplayBinding(input, certification.certified);
  const drifts = validateConfidenceDrift({
    engineInput: input,
    errors,
  });

  const frozenByContainment =
    input.proposalFreezeResult.status !== "ACTIVE"
    || input.proposalRevocationResult.status !== "NOT_REVOKED";

  const status = resolveConfidenceStatus({
    errors,
    drifts,
    frozenByContainment,
  });

  errors.push(...validateConfidenceReplay({
    score,
    certification,
    drifts,
  }));

  const auditEntries = buildAuditEntries({
    score,
    status,
    generatedAt: input.generatedAt,
  });
  const auditLedger = auditEntries.reduce<readonly import("./types/confidenceTypes").DeterministicConfidenceLedgerEntry[]>(
    (ledger, entry) => appendConfidenceAuditEntry({ existing: ledger, entry }),
    input.existingAuditLedger ?? [],
  );

  if (!verifyImmutableLedgerChain([...auditLedger])) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_FAIL_CLOSED",
      message: "Confidence audit append failed immutable chain validation.",
      path: "auditLedger",
    });
  }

  return Object.freeze({
    status,
    score,
    factors,
    snapshotBundle: snapshotLoad.snapshotBundle,
    versions: versionLoad.versions,
    replayBinding,
    lineage,
    drifts,
    auditEntries,
    auditLedger,
    certification,
    errors: Object.freeze(errors),
    warnings: Object.freeze(
      status === "COMPLETED"
        ? ["Confidence remained deterministic, advisory-only, and subordinate to constitutional containment."]
        : ["Confidence increased caution without creating authority and preserved fail-closed containment."],
    ),
    stages: buildStages(errors),
    deterministicHash: hashConfidenceValue("deterministic-confidence-result", canonicalizeConfidenceToString({
      inputHash: score.inputHash,
      outputHash: score.outputHash,
      lineageHash: score.lineageHash,
      driftIds: drifts.map((drift) => drift.driftId),
      auditHashes: auditEntries.map((entry) => entry.entryHash),
      status,
      errorCodes: errors.map((error) => error.code),
      certificationHash: certification.certificationHash,
    })),
    derivedOnly: true as const,
  });
}

export const DeterministicConfidenceEngine = scoreDeterministicConfidence;
