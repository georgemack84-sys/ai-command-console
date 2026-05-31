import { describe, expect, it } from "vitest";

import {
  buildAdvisoryEvidenceLifecycleExportBundle,
} from "@/services/advisory/advisoryEvidenceLifecycleExportBundle";

const generatedAt = "2026-05-30T12:00:00.000Z";

function lifecycleRollup(overrides: Record<string, unknown> = {}) {
  return {
    lifecycleStatus: "LIFECYCLE_AVAILABLE",
    exportStatus: "EXPORTED",
    verificationStatus: "VALID",
    reviewStatus: "REVIEWABLE",
    archiveStatus: "INDEXED",
    summaryStatus: "SUMMARIZED",
    retentionStatus: "RETAIN",
    snapshotId: "sha256:snapshot-id",
    snapshotHash: "sha256:snapshot",
    summaryHash: "sha256:summary",
    retentionHash: "sha256:retention",
    policyVersions: [
      "advisory-evidence-retention/v1",
      "advisory-snapshot-export/v1",
    ],
    reviewRequired: false,
    trusted: false,
    importedToLiveState: false,
    authority: "READ_ONLY",
    mayDeploy: false,
    mayRetry: false,
    mayRollback: false,
    mayCancel: false,
    mayResume: false,
    mayApprove: false,
    mayOverride: false,
    mayDelete: false,
    mayCompact: false,
    mayArchiveMutate: false,
    mayImportToLiveState: false,
    reasons: ["ROLLUP_AVAILABLE"],
    ...overrides,
  };
}

function archiveSummary(overrides: Record<string, unknown> = {}) {
  return {
    summaryStatus: "SUMMARIZED",
    totalEntries: 1,
    counts: {
      indexed: 1,
      disputed: 0,
      failed: 0,
      unknown: 0,
    },
    bySource: [{ source: "OFFLINE_REVIEW", count: 1 }],
    disputedReferences: [],
    failedReferences: [],
    evidenceCoverage: {
      withSnapshotId: 1,
      withSnapshotHash: 1,
      withPolicyVersion: 1,
      withEvidenceRef: 1,
    },
    summaryHash: "sha256:archive-summary",
    generatedAt,
    authority: "READ_ONLY",
    trusted: false,
    importedToLiveState: false,
    mayDeploy: false,
    mayRetry: false,
    mayRollback: false,
    mayCancel: false,
    mayResume: false,
    mayApprove: false,
    mayOverride: false,
    reasons: ["SUMMARY_AVAILABLE"],
    ...overrides,
  };
}

function retentionMetadata(overrides: Record<string, unknown> = {}) {
  return {
    retentionStatus: "RETAIN",
    retentionHash: "sha256:retention",
    referenceHash: "sha256:reference",
    snapshotHash: "sha256:snapshot",
    retentionClass: "STANDARD",
    retentionReason: ["RETENTION_CLASS_STANDARD"],
    source: "OFFLINE_REVIEW",
    policyVersion: "advisory-evidence-retention/v1",
    indexedAt: generatedAt,
    retentionUntil: "2026-08-30T12:00:00.000Z",
    reviewRequired: false,
    evaluatedAt: generatedAt,
    authority: "READ_ONLY",
    trusted: false,
    importedToLiveState: false,
    mayDelete: false,
    mayCompact: false,
    mayArchiveMutate: false,
    mayImportToLiveState: false,
    reasons: ["RETENTION_AVAILABLE"],
    ...overrides,
  };
}

function bundle(overrides: Parameters<typeof buildAdvisoryEvidenceLifecycleExportBundle>[0] = {}) {
  return buildAdvisoryEvidenceLifecycleExportBundle({
    lifecycleRollup: lifecycleRollup(),
    archiveSummary: archiveSummary(),
    retentionMetadata: retentionMetadata(),
    generatedAt,
    ...overrides,
  });
}

describe("advisory evidence lifecycle export bundle", () => {
  it("creates a read-only export bundle with evidence hashes and policy versions", () => {
    const result = bundle();

    expect(result.bundleVersion).toBe("advisory-evidence-lifecycle-export-bundle/v1");
    expect(result.generatedAt).toBe(generatedAt);
    expect(result.bundleId).toMatch(/^sha256:/);
    expect(result.hashes.rollupHash).toMatch(/^sha256:/);
    expect(result.hashes.archiveSummaryHash).toMatch(/^sha256:/);
    expect(result.hashes.retentionHash).toMatch(/^sha256:/);
    expect(result.hashes.bundleHash).toMatch(/^sha256:/);
    expect(result.policyVersions).toEqual({
      archivePolicyVersion: "advisory-evidence-archive-summary/v1",
      lifecyclePolicyVersion: "advisory-evidence-lifecycle-rollup/v1",
      retentionPolicyVersion: "advisory-evidence-retention/v1",
    });
    expect(result.lifecycleRollup).toEqual(lifecycleRollup());
    expect(result.archiveSummary).toEqual(archiveSummary());
    expect(result.retentionMetadata).toEqual(retentionMetadata());
  });

  it("keeps bundle hashes deterministic and excludes generatedAt from hash material", () => {
    const first = bundle({ generatedAt: "2026-05-30T12:00:00.000Z" });
    const second = bundle({ generatedAt: "2026-06-01T12:00:00.000Z" });

    expect(first.hashes.bundleHash).toBe(second.hashes.bundleHash);
    expect(first.bundleId).toBe(second.bundleId);
    expect(first.generatedAt).not.toBe(second.generatedAt);
  });

  it("changes the bundle hash when rollup summary or retention evidence changes", () => {
    const base = bundle();
    const changedRollup = bundle({ lifecycleRollup: lifecycleRollup({ snapshotHash: "sha256:changed-snapshot" }) });
    const changedSummary = bundle({ archiveSummary: archiveSummary({ totalEntries: 2 }) });
    const changedRetention = bundle({ retentionMetadata: retentionMetadata({ retentionClass: "LONG_TERM" }) });

    expect(changedRollup.hashes.bundleHash).not.toBe(base.hashes.bundleHash);
    expect(changedSummary.hashes.bundleHash).not.toBe(base.hashes.bundleHash);
    expect(changedRetention.hashes.bundleHash).not.toBe(base.hashes.bundleHash);
  });

  it("normalizes reasons deterministically", () => {
    const first = bundle({
      lifecycleRollup: lifecycleRollup({ reasons: ["Z_REASON", "A_REASON", "A_REASON"] }),
      archiveSummary: archiveSummary({ reasons: ["SUMMARY_AVAILABLE"] }),
      retentionMetadata: retentionMetadata({ reasons: ["RETENTION_AVAILABLE", "A_REASON"] }),
    });
    const second = bundle({
      lifecycleRollup: lifecycleRollup({ reasons: ["A_REASON", "Z_REASON"] }),
      archiveSummary: archiveSummary({ reasons: ["SUMMARY_AVAILABLE"] }),
      retentionMetadata: retentionMetadata({ reasons: ["A_REASON", "RETENTION_AVAILABLE"] }),
    });

    expect(first.reasons).toEqual([
      "A_REASON",
      "RETENTION_AVAILABLE",
      "SUMMARY_AVAILABLE",
      "Z_REASON",
    ]);
    expect(first.reasons).toEqual(second.reasons);
    expect(first.hashes.bundleHash).toBe(second.hashes.bundleHash);
  });

  it("keeps all authority, import, mutation, lifecycle, and workflow controls disabled", () => {
    const result = bundle();

    expect(result.authority).toEqual({
      trusted: false,
      importedToLiveState: false,
      mayImportToLiveState: false,
      mayMutateArchive: false,
      mayDelete: false,
      mayCompact: false,
      mayApprove: false,
      mayDeploy: false,
      mayTriggerWorkflow: false,
    });
    expect(Object.keys(result.authority)).not.toEqual(expect.arrayContaining([
      "mayRetry",
      "mayRollback",
      "mayCancel",
      "mayResume",
    ]));
    expect(JSON.stringify(result.authority)).not.toMatch(/deployable|retryAllowed|cancelAllowed|rollbackAllowed|resumeAllowed/i);
  });

  it("does not mutate inputs or introduce file write/API route behavior", () => {
    const rollup = lifecycleRollup();
    const summary = archiveSummary();
    const retention = retentionMetadata();
    const before = JSON.stringify({ rollup, summary, retention });

    const result = buildAdvisoryEvidenceLifecycleExportBundle({
      lifecycleRollup: rollup,
      archiveSummary: summary,
      retentionMetadata: retention,
      generatedAt,
    });

    expect(JSON.stringify({ rollup, summary, retention })).toBe(before);
    expect(result.authority.mayMutateArchive).toBe(false);
    expect(result.authority.mayTriggerWorkflow).toBe(false);
    expect(Object.keys(result)).not.toContain("route");
    expect(Object.keys(result)).not.toContain("writePath");
    expect(Object.keys(result)).not.toContain("importPath");
  });
});
