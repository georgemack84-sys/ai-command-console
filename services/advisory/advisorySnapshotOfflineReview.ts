import {
  verifyAdvisorySnapshot,
  type AdvisorySnapshotVerificationStatus,
} from "./advisorySnapshotVerification";

export type AdvisorySnapshotOfflineReviewStatus = "REVIEWABLE" | "DISPUTED_REVIEW" | "FAILED_REVIEW";

export type AdvisorySnapshotReviewFinding = Readonly<{
  category: "HASH" | "IDENTITY" | "POLICY" | "AUTHORITY" | "PAYLOAD" | "REPLAYABILITY";
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
}>;

export type AdvisorySnapshotOfflineReview = Readonly<{
  reviewStatus: AdvisorySnapshotOfflineReviewStatus;
  verificationStatus: AdvisorySnapshotVerificationStatus;
  snapshotId: string | null;
  snapshotHash: string | null;
  hashMatches: boolean;
  idMatches: boolean;
  policyVersion: string | null;
  unifiedStatus: string | null;
  unifiedRisk: string | null;
  authorityStatus: "READ_ONLY_CONFIRMED" | "AUTHORITY_LEAK_DETECTED" | "UNKNOWN";
  operatorSummary: string;
  reviewFindings: readonly AdvisorySnapshotReviewFinding[];
  authority: "READ_ONLY";
  mayDeploy: false;
  mayRetry: false;
  mayRollback: false;
  mayCancel: false;
  mayResume: false;
  mayApprove: false;
  mayOverride: false;
  reasons: readonly string[];
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizedReasons(reasons: readonly string[]) {
  return Object.freeze([...new Set(reasons)].sort());
}

function reviewStatusFromVerification(status: AdvisorySnapshotVerificationStatus): AdvisorySnapshotOfflineReviewStatus {
  if (status === "VALID") return "REVIEWABLE";
  if (status === "DISPUTED") return "DISPUTED_REVIEW";
  return "FAILED_REVIEW";
}

function authorityStatusFromReasons(reasons: readonly string[]) {
  if (reasons.some((reason) => reason === "AUTHORITY_NOT_READ_ONLY" || reason.startsWith("CONTROL_AUTHORITY_LEAK:"))) {
    return "AUTHORITY_LEAK_DETECTED" as const;
  }
  if (reasons.some((reason) => reason === "SNAPSHOT_MISSING" || reason === "SNAPSHOT_MALFORMED")) {
    return "UNKNOWN" as const;
  }
  return "READ_ONLY_CONFIRMED" as const;
}

function operatorSummary(status: AdvisorySnapshotOfflineReviewStatus) {
  if (status === "REVIEWABLE") {
    return "Snapshot is reviewable. Hash and identity verified. Advisory authority remains read-only.";
  }
  if (status === "DISPUTED_REVIEW") {
    return "Snapshot is disputed. Hash or identity verification failed. Do not treat this snapshot as trusted evidence.";
  }
  return "Snapshot review failed. Required advisory payload fields are missing.";
}

function severityFor(status: AdvisorySnapshotOfflineReviewStatus, warning: boolean) {
  if (status === "FAILED_REVIEW") return "CRITICAL" as const;
  if (warning) return "WARNING" as const;
  return "INFO" as const;
}

function buildFindings(input: {
  reviewStatus: AdvisorySnapshotOfflineReviewStatus;
  hashMatches: boolean;
  idMatches: boolean;
  policyVersion: string | null;
  authorityStatus: AdvisorySnapshotOfflineReview["authorityStatus"];
  unifiedStatus: string | null;
  unifiedRisk: string | null;
  replayable: boolean;
}): readonly AdvisorySnapshotReviewFinding[] {
  const failed = input.reviewStatus === "FAILED_REVIEW";
  const findings: AdvisorySnapshotReviewFinding[] = [
    {
      category: "HASH",
      severity: severityFor(input.reviewStatus, !input.hashMatches),
      message: input.hashMatches ? "Snapshot hash verified." : "Snapshot hash could not be verified.",
    },
    {
      category: "IDENTITY",
      severity: severityFor(input.reviewStatus, !input.idMatches),
      message: input.idMatches ? "Snapshot identity verified." : "Snapshot identity could not be verified.",
    },
    {
      category: "POLICY",
      severity: severityFor(input.reviewStatus, !input.policyVersion),
      message: input.policyVersion ? `Policy version: ${input.policyVersion}.` : "Policy version unavailable.",
    },
    {
      category: "AUTHORITY",
      severity: severityFor(input.reviewStatus, input.authorityStatus !== "READ_ONLY_CONFIRMED"),
      message: input.authorityStatus === "READ_ONLY_CONFIRMED"
        ? "Read-only advisory authority confirmed."
        : "Advisory authority containment could not be confirmed.",
    },
    {
      category: "PAYLOAD",
      severity: severityFor(input.reviewStatus, failed || !input.unifiedStatus || !input.unifiedRisk),
      message: input.unifiedStatus && input.unifiedRisk
        ? `Payload status ${input.unifiedStatus} with risk ${input.unifiedRisk}.`
        : "Advisory payload fields unavailable.",
    },
    {
      category: "REPLAYABILITY",
      severity: severityFor(input.reviewStatus, !input.replayable),
      message: input.replayable ? "Snapshot is replayable from normalized contents." : "Snapshot replayability could not be confirmed.",
    },
  ];

  return Object.freeze(findings.map((finding) => Object.freeze(finding)));
}

export function reviewAdvisorySnapshotOffline(snapshot: unknown): AdvisorySnapshotOfflineReview {
  const verification = verifyAdvisorySnapshot(snapshot);
  const snapshotRecord = isRecord(snapshot) ? snapshot : null;
  const reviewStatus = reviewStatusFromVerification(verification.verificationStatus);
  const authorityStatus = authorityStatusFromReasons(verification.reasons);
  const unifiedStatus = typeof snapshotRecord?.unifiedStatus === "string" ? snapshotRecord.unifiedStatus : null;
  const unifiedRisk = typeof snapshotRecord?.unifiedRisk === "string" ? snapshotRecord.unifiedRisk : null;
  const reasons = normalizedReasons(verification.reasons);

  return Object.freeze({
    reviewStatus,
    verificationStatus: verification.verificationStatus,
    snapshotId: verification.snapshotId,
    snapshotHash: verification.snapshotHash,
    hashMatches: verification.hashMatches,
    idMatches: verification.idMatches,
    policyVersion: verification.policyVersion,
    unifiedStatus,
    unifiedRisk,
    authorityStatus,
    operatorSummary: operatorSummary(reviewStatus),
    reviewFindings: buildFindings({
      reviewStatus,
      hashMatches: verification.hashMatches,
      idMatches: verification.idMatches,
      policyVersion: verification.policyVersion,
      authorityStatus,
      unifiedStatus,
      unifiedRisk,
      replayable: verification.replayable,
    }),
    authority: "READ_ONLY",
    mayDeploy: false,
    mayRetry: false,
    mayRollback: false,
    mayCancel: false,
    mayResume: false,
    mayApprove: false,
    mayOverride: false,
    reasons,
  });
}
