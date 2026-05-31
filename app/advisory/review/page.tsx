import { requireSessionUser } from "@/src/lib/auth";
import { AdvisorySnapshotReviewPanel } from "@/components/advisory/AdvisorySnapshotReviewPanel";
import type { AdvisorySnapshotOfflineReview } from "@/services/advisory/advisorySnapshotOfflineReview";

export const dynamic = "force-dynamic";

const EMPTY_OFFLINE_REVIEW: AdvisorySnapshotOfflineReview = Object.freeze({
  reviewStatus: "FAILED_REVIEW",
  verificationStatus: "FAILED",
  snapshotId: null,
  snapshotHash: null,
  hashMatches: false,
  idMatches: false,
  policyVersion: null,
  unifiedStatus: null,
  unifiedRisk: null,
  authorityStatus: "UNKNOWN",
  operatorSummary: "Snapshot review failed. Required advisory payload fields are missing.",
  reviewFindings: Object.freeze([
    Object.freeze({
      category: "PAYLOAD",
      severity: "CRITICAL",
      message: "Advisory payload fields unavailable.",
    }),
  ]),
  authority: "READ_ONLY",
  mayDeploy: false,
  mayRetry: false,
  mayRollback: false,
  mayCancel: false,
  mayResume: false,
  mayApprove: false,
  mayOverride: false,
  reasons: Object.freeze(["SNAPSHOT_MISSING"]),
});

export default async function AdvisorySnapshotReviewPage() {
  await requireSessionUser();

  return <AdvisorySnapshotReviewPanel review={EMPTY_OFFLINE_REVIEW} />;
}
