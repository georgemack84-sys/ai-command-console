import { describe, expect, it } from "vitest";

import { aggregateUnifiedAdvisory } from "@/services/advisory";
import { buildAdvisoryReadModel } from "@/services/advisory/advisoryReadModel";
import { buildAdvisorySnapshotExport } from "@/services/advisory/advisorySnapshotExport";
import { reviewAdvisorySnapshotOffline, type AdvisorySnapshotOfflineReview } from "@/services/advisory/advisorySnapshotOfflineReview";
import { indexAdvisoryEvidenceReference } from "@/services/advisory/advisoryEvidenceArchiveIndex";

function review(overrides: Partial<AdvisorySnapshotOfflineReview> = {}) {
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
  const snapshot = buildAdvisorySnapshotExport(
    buildAdvisoryReadModel({ aggregation, generatedAt: "2026-05-29T12:00:00.000Z" }),
    "2026-05-29T12:00:00.000Z",
  );

  return {
    ...reviewAdvisorySnapshotOffline(snapshot),
    ...overrides,
  } as AdvisorySnapshotOfflineReview;
}

describe("advisory evidence archive index", () => {
  it("indexes reviewable snapshot references", () => {
    const entry = indexAdvisoryEvidenceReference(review(), {
      evidenceRef: "advisory-snapshot:release-2026-05-29",
      indexedAt: "2026-05-29T12:00:00.000Z",
      source: "OFFLINE_REVIEW",
    });

    expect(entry.archiveStatus).toBe("INDEXED");
    expect(entry.snapshotId).toMatch(/^sha256:/);
    expect(entry.snapshotHash).toMatch(/^sha256:/);
    expect(entry.reviewStatus).toBe("REVIEWABLE");
    expect(entry.verificationStatus).toBe("VALID");
    expect(entry.policyVersion).toBe("advisory-snapshot-export/v1");
    expect(entry.authority).toBe("READ_ONLY");
    expect(entry.trusted).toBe(false);
    expect(entry.importedToLiveState).toBe(false);
    expect(entry.mayDeploy).toBe(false);
    expect(entry.mayRetry).toBe(false);
    expect(entry.mayRollback).toBe(false);
    expect(entry.mayCancel).toBe(false);
    expect(entry.mayResume).toBe(false);
    expect(entry.mayApprove).toBe(false);
    expect(entry.mayOverride).toBe(false);
  });

  it("classifies disputed and failed reviews", () => {
    const disputed = indexAdvisoryEvidenceReference(
      review({ reviewStatus: "DISPUTED_REVIEW", verificationStatus: "DISPUTED" }),
      { evidenceRef: "advisory-snapshot:disputed", indexedAt: "2026-05-29T12:00:00.000Z" },
    );
    const failed = indexAdvisoryEvidenceReference(
      review({ reviewStatus: "FAILED_REVIEW", verificationStatus: "FAILED" }),
      { evidenceRef: "advisory-snapshot:failed", indexedAt: "2026-05-29T12:00:00.000Z" },
    );

    expect(disputed.archiveStatus).toBe("DISPUTED_REFERENCE");
    expect(disputed.reasons).toContain("REVIEW_DISPUTED");
    expect(failed.archiveStatus).toBe("FAILED_REFERENCE");
    expect(failed.reasons).toContain("REVIEW_FAILED");
  });

  it("disputes authority leaks and may control flags", () => {
    const authorityLeak = indexAdvisoryEvidenceReference(
      review({ authority: "CONTROL" as AdvisorySnapshotOfflineReview["authority"] }),
      { evidenceRef: "advisory-snapshot:authority", indexedAt: "2026-05-29T12:00:00.000Z" },
    );
    const controlLeak = indexAdvisoryEvidenceReference(
      review({ mayOverride: true as AdvisorySnapshotOfflineReview["mayOverride"] }),
      { evidenceRef: "advisory-snapshot:control", indexedAt: "2026-05-29T12:00:00.000Z" },
    );

    expect(authorityLeak.archiveStatus).toBe("DISPUTED_REFERENCE");
    expect(authorityLeak.reasons).toContain("AUTHORITY_NOT_READ_ONLY");
    expect(controlLeak.archiveStatus).toBe("DISPUTED_REFERENCE");
    expect(controlLeak.reasons).toContain("CONTROL_AUTHORITY_LEAK:mayOverride");
    expect(controlLeak.mayOverride).toBe(false);
  });

  it("fails safely for missing references and absent required fields", () => {
    const missing = indexAdvisoryEvidenceReference(undefined, {
      evidenceRef: "advisory-snapshot:missing",
      indexedAt: "2026-05-29T12:00:00.000Z",
    });
    const absent = indexAdvisoryEvidenceReference(
      review({ snapshotHash: null }),
      { evidenceRef: "advisory-snapshot:absent", indexedAt: "2026-05-29T12:00:00.000Z" },
    );

    expect(missing.archiveStatus).toBe("FAILED_REFERENCE");
    expect(missing.reasons).toContain("REFERENCE_MISSING");
    expect(absent.archiveStatus).toBe("FAILED_REFERENCE");
    expect(absent.reasons).toContain("REQUIRED_FIELDS_ABSENT");
  });

  it("hashes references deterministically and excludes indexedAt", () => {
    const first = indexAdvisoryEvidenceReference(review(), {
      evidenceRef: "advisory-snapshot:stable",
      indexedAt: "2026-05-29T12:00:00.000Z",
      source: "EXPORTED_SNAPSHOT",
    });
    const second = indexAdvisoryEvidenceReference(review(), {
      evidenceRef: "advisory-snapshot:stable",
      indexedAt: "2026-05-29T13:00:00.000Z",
      source: "EXPORTED_SNAPSHOT",
    });

    expect(first.referenceHash).toBe(second.referenceHash);
    expect(first.indexedAt).not.toBe(second.indexedAt);
  });

  it("does not mutate input and keeps archive entries deterministic", () => {
    const input = review();
    const before = JSON.stringify(input);
    const first = indexAdvisoryEvidenceReference(input, {
      evidenceRef: "advisory-snapshot:deterministic",
      indexedAt: "2026-05-29T12:00:00.000Z",
    });
    const second = indexAdvisoryEvidenceReference(input, {
      evidenceRef: "advisory-snapshot:deterministic",
      indexedAt: "2026-05-29T12:00:00.000Z",
    });

    expect(JSON.stringify(input)).toBe(before);
    expect(first).toEqual(second);
  });
});
