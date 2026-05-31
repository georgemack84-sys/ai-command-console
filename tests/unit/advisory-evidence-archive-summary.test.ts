import { describe, expect, it } from "vitest";

import {
  summarizeAdvisoryEvidenceArchive,
} from "@/services/advisory/advisoryEvidenceArchiveSummary";
import type { AdvisoryEvidenceArchiveEntry } from "@/services/advisory/advisoryEvidenceArchiveIndex";

function entry(overrides: Partial<AdvisoryEvidenceArchiveEntry> = {}): AdvisoryEvidenceArchiveEntry {
  return {
    archiveStatus: "INDEXED",
    referenceHash: "sha256:reference",
    snapshotId: "sha256:id",
    snapshotHash: "sha256:snapshot",
    reviewStatus: "REVIEWABLE",
    verificationStatus: "VALID",
    policyVersion: "advisory-snapshot-export/v1",
    evidenceRef: "advisory-snapshot:release",
    indexedAt: "2026-05-29T12:00:00.000Z",
    source: "OFFLINE_REVIEW",
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
    reasons: [],
    ...overrides,
  };
}

describe("advisory evidence archive summary", () => {
  it("summarizes indexed disputed and failed archive entries", () => {
    const summary = summarizeAdvisoryEvidenceArchive([
      entry({ archiveStatus: "INDEXED", referenceHash: "sha256:indexed", source: "OFFLINE_REVIEW" }),
      entry({
        archiveStatus: "DISPUTED_REFERENCE",
        referenceHash: "sha256:disputed",
        source: "EXPORTED_SNAPSHOT",
        reasons: ["REVIEW_DISPUTED"],
      }),
      entry({
        archiveStatus: "FAILED_REFERENCE",
        referenceHash: "sha256:failed",
        source: "MANUAL_REFERENCE",
        snapshotId: null,
        reasons: ["REVIEW_FAILED"],
      }),
    ], "2026-05-29T12:00:00.000Z");

    expect(summary.summaryStatus).toBe("DISPUTED_SUMMARY");
    expect(summary.totalEntries).toBe(3);
    expect(summary.counts).toEqual({ indexed: 1, disputed: 1, failed: 1, unknown: 0 });
    expect(summary.bySource).toEqual([
      { source: "EXPORTED_SNAPSHOT", count: 1 },
      { source: "MANUAL_REFERENCE", count: 1 },
      { source: "OFFLINE_REVIEW", count: 1 },
    ]);
    expect(summary.disputedReferences).toEqual([{ referenceHash: "sha256:disputed", reason: "REVIEW_DISPUTED" }]);
    expect(summary.failedReferences).toEqual([{ referenceHash: "sha256:failed", reason: "REVIEW_FAILED" }]);
    expect(summary.evidenceCoverage).toEqual({
      withEvidenceRef: 3,
      withPolicyVersion: 3,
      withSnapshotHash: 3,
      withSnapshotId: 2,
    });
  });

  it("returns SUMMARIZED for normalized indexed entries", () => {
    const summary = summarizeAdvisoryEvidenceArchive([
      entry({ source: "OFFLINE_REVIEW", referenceHash: "sha256:a" }),
      entry({ source: "OFFLINE_REVIEW", referenceHash: "sha256:b" }),
    ], "2026-05-29T12:00:00.000Z");

    expect(summary.summaryStatus).toBe("SUMMARIZED");
    expect(summary.counts.indexed).toBe(2);
    expect(summary.reasons).toEqual([]);
  });

  it("disputes unknown status and authority leakage", () => {
    const unknown = summarizeAdvisoryEvidenceArchive([
      entry({ archiveStatus: "ODD_STATUS" as AdvisoryEvidenceArchiveEntry["archiveStatus"] }),
    ], "2026-05-29T12:00:00.000Z");
    const authorityLeak = summarizeAdvisoryEvidenceArchive([
      entry({ mayDeploy: true as AdvisoryEvidenceArchiveEntry["mayDeploy"] }),
    ], "2026-05-29T12:00:00.000Z");

    expect(unknown.summaryStatus).toBe("DISPUTED_SUMMARY");
    expect(unknown.counts.unknown).toBe(1);
    expect(unknown.reasons).toContain("UNKNOWN_ARCHIVE_STATUS:ODD_STATUS");
    expect(authorityLeak.summaryStatus).toBe("DISPUTED_SUMMARY");
    expect(authorityLeak.reasons).toContain("CONTROL_AUTHORITY_LEAK:mayDeploy");
    expect(authorityLeak.mayDeploy).toBe(false);
  });

  it("fails safely for missing and malformed input", () => {
    const missing = summarizeAdvisoryEvidenceArchive(undefined, "2026-05-29T12:00:00.000Z");
    const malformed = summarizeAdvisoryEvidenceArchive("not-entries", "2026-05-29T12:00:00.000Z");

    expect(missing.summaryStatus).toBe("FAILED_SUMMARY");
    expect(missing.reasons).toContain("ARCHIVE_ENTRIES_MISSING");
    expect(malformed.summaryStatus).toBe("FAILED_SUMMARY");
    expect(malformed.reasons).toContain("ARCHIVE_ENTRIES_MALFORMED");
  });

  it("hashes summaries deterministically and excludes generatedAt", () => {
    const entries = [entry({ referenceHash: "sha256:stable" })];
    const first = summarizeAdvisoryEvidenceArchive(entries, "2026-05-29T12:00:00.000Z");
    const second = summarizeAdvisoryEvidenceArchive(entries, "2026-05-29T13:00:00.000Z");

    expect(first.summaryHash).toBe(second.summaryHash);
    expect(first.generatedAt).not.toBe(second.generatedAt);
  });

  it("does not mutate inputs and always contains authority", () => {
    const entries = [entry()];
    const before = JSON.stringify(entries);
    const summary = summarizeAdvisoryEvidenceArchive(entries, "2026-05-29T12:00:00.000Z");

    expect(JSON.stringify(entries)).toBe(before);
    expect(summary.authority).toBe("READ_ONLY");
    expect(summary.trusted).toBe(false);
    expect(summary.importedToLiveState).toBe(false);
    expect(summary.mayDeploy).toBe(false);
    expect(summary.mayRetry).toBe(false);
    expect(summary.mayRollback).toBe(false);
    expect(summary.mayCancel).toBe(false);
    expect(summary.mayResume).toBe(false);
    expect(summary.mayApprove).toBe(false);
    expect(summary.mayOverride).toBe(false);
  });
});
