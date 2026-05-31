import { describe, expect, it } from "vitest";

import { aggregateUnifiedAdvisory } from "@/services/advisory";
import { buildAdvisoryReadModel } from "@/services/advisory/advisoryReadModel";
import { buildAdvisorySnapshotExport } from "@/services/advisory/advisorySnapshotExport";
import { reviewAdvisorySnapshotOffline } from "@/services/advisory/advisorySnapshotOfflineReview";

function validSnapshot() {
  const aggregation = aggregateUnifiedAdvisory({
    releaseCertification: {
      status: "COMPATIBLE",
      evidenceHash: "sha256:release",
      governanceReplayHash: "sha256:release-replay",
      replayEvidenceAvailable: true,
      authority: "READ_ONLY",
      mayBlockDeployment: false,
      mayTriggerRetry: false,
      mayTriggerRollback: false,
    },
    operationalRules: {
      advisoryStatus: "SAFE",
      evidenceHash: "sha256:operational",
      ruleHash: "sha256:rules",
      evidenceRefs: ["operational-rules:evaluation"],
      replayable: true,
      authority: "ADVISORY_ONLY",
      mayDeploy: false,
      mayRetry: false,
      mayRollback: false,
      mayCancel: false,
      mayResume: false,
      requiresExplicitEnforcementPhase: true,
    },
    deploymentOverrun: {
      advisoryStatus: "NORMAL",
      risk: "LOW",
      evidenceHash: "sha256:overrun",
      advisoryHash: "sha256:overrun-advisory",
      evidenceRefs: ["deployment-overrun:evaluation"],
      replayable: true,
      authority: "ADVISORY_ONLY",
      mayDeploy: false,
      mayRetry: false,
      mayRollback: false,
      mayCancel: false,
      mayResume: false,
      requiresExplicitEnforcementPhase: true,
    },
  });

  return buildAdvisorySnapshotExport(
    buildAdvisoryReadModel({
      aggregation,
      generatedAt: "2026-05-29T12:00:00.000Z",
    }),
    "2026-05-29T12:00:00.000Z",
  );
}

describe("advisory snapshot offline review", () => {
  it("returns REVIEWABLE for a valid snapshot", () => {
    const review = reviewAdvisorySnapshotOffline(validSnapshot());

    expect(review.reviewStatus).toBe("REVIEWABLE");
    expect(review.verificationStatus).toBe("VALID");
    expect(review.hashMatches).toBe(true);
    expect(review.idMatches).toBe(true);
    expect(review.authorityStatus).toBe("READ_ONLY_CONFIRMED");
    expect(review.operatorSummary).toBe(
      "Snapshot is reviewable. Hash and identity verified. Advisory authority remains read-only.",
    );
    expect(review.reviewFindings.map((finding) => finding.category)).toEqual([
      "HASH",
      "IDENTITY",
      "POLICY",
      "AUTHORITY",
      "PAYLOAD",
      "REPLAYABILITY",
    ]);
  });

  it("returns DISPUTED_REVIEW for tampered hash and ID", () => {
    const hashReview = reviewAdvisorySnapshotOffline({
      ...validSnapshot(),
      snapshotHash: "sha256:tampered",
    });
    const idReview = reviewAdvisorySnapshotOffline({
      ...validSnapshot(),
      snapshotId: "sha256:tampered",
    });

    expect(hashReview.reviewStatus).toBe("DISPUTED_REVIEW");
    expect(hashReview.operatorSummary).toBe(
      "Snapshot is disputed. Hash or identity verification failed. Do not treat this snapshot as trusted evidence.",
    );
    expect(hashReview.reviewFindings.some((finding) => finding.category === "HASH" && finding.severity === "WARNING")).toBe(true);
    expect(idReview.reviewStatus).toBe("DISPUTED_REVIEW");
    expect(idReview.reviewFindings.some((finding) => finding.category === "IDENTITY" && finding.severity === "WARNING")).toBe(true);
  });

  it("returns DISPUTED_REVIEW for authority leaks", () => {
    const review = reviewAdvisorySnapshotOffline({
      ...validSnapshot(),
      mayRetry: true,
    });

    expect(review.reviewStatus).toBe("DISPUTED_REVIEW");
    expect(review.authorityStatus).toBe("AUTHORITY_LEAK_DETECTED");
    expect(review.authority).toBe("READ_ONLY");
    expect(review.mayRetry).toBe(false);
  });

  it("returns FAILED_REVIEW for missing and malformed snapshots", () => {
    const missing = reviewAdvisorySnapshotOffline(undefined);
    const malformed = reviewAdvisorySnapshotOffline("not-a-snapshot");

    expect(missing.reviewStatus).toBe("FAILED_REVIEW");
    expect(missing.operatorSummary).toBe("Snapshot review failed. Required advisory payload fields are missing.");
    expect(missing.reviewFindings.every((finding) => finding.severity === "CRITICAL")).toBe(true);
    expect(malformed.reviewStatus).toBe("FAILED_REVIEW");
    expect(malformed.reasons).toContain("SNAPSHOT_MALFORMED");
  });

  it("is deterministic and does not mutate input", () => {
    const snapshot = validSnapshot();
    const before = JSON.stringify(snapshot);
    const first = reviewAdvisorySnapshotOffline(snapshot);
    const second = reviewAdvisorySnapshotOffline(snapshot);

    expect(JSON.stringify(snapshot)).toBe(before);
    expect(first).toEqual(second);
  });

  it("does not use live advisory state or create authority", () => {
    const review = reviewAdvisorySnapshotOffline(validSnapshot());

    expect(review.authority).toBe("READ_ONLY");
    expect(review.mayDeploy).toBe(false);
    expect(review.mayRetry).toBe(false);
    expect(review.mayRollback).toBe(false);
    expect(review.mayCancel).toBe(false);
    expect(review.mayResume).toBe(false);
    expect(review.mayApprove).toBe(false);
    expect(review.mayOverride).toBe(false);
    expect(review.operatorSummary).not.toMatch(/deploy allowed|retry allowed|override accepted|rollback recommended|cancel now|resume now/i);
  });
});
