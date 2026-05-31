import { describe, expect, it } from "vitest";

import {
  buildAdvisoryEvidenceLifecycleExportBundle,
} from "@/services/advisory/advisoryEvidenceLifecycleExportBundle";
import {
  verifyAdvisoryEvidenceLifecycleBundle,
} from "@/services/advisory/advisoryEvidenceLifecycleBundleVerification";

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

function validBundle(overrides: Parameters<typeof buildAdvisoryEvidenceLifecycleExportBundle>[0] = {}) {
  return buildAdvisoryEvidenceLifecycleExportBundle({
    lifecycleRollup: lifecycleRollup(),
    archiveSummary: archiveSummary(),
    retentionMetadata: retentionMetadata(),
    generatedAt,
    ...overrides,
  });
}

function tamper<T extends object>(value: T, patch: Partial<T>) {
  return {
    ...value,
    ...patch,
  };
}

describe("advisory evidence lifecycle bundle verification", () => {
  it("returns VALID_BUNDLE for a sealed exported bundle", () => {
    const result = verifyAdvisoryEvidenceLifecycleBundle(validBundle());

    expect(result.verificationStatus).toBe("VALID_BUNDLE");
    expect(result.bundleId).toMatch(/^sha256:/);
    expect(result.bundleHash).toMatch(/^sha256:/);
    expect(result.expectedBundleHash).toBe(result.bundleHash);
    expect(result.hashMatches).toBe(true);
    expect(result.includedHashesVerified).toBe(true);
    expect(result.authorityVerified).toBe(true);
    expect(result.retentionVerified).toBe(true);
    expect(result.rollupVerified).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.policyVersion).toBe("advisory-evidence-lifecycle-export-bundle/v1");
  });

  it("recomputes bundle hashes deterministically while ignoring generated timestamps", () => {
    const first = verifyAdvisoryEvidenceLifecycleBundle(validBundle({ generatedAt: "2026-05-30T12:00:00.000Z" }));
    const second = verifyAdvisoryEvidenceLifecycleBundle(validBundle({ generatedAt: "2026-06-01T12:00:00.000Z" }));

    expect(first.bundleHash).toBe(second.bundleHash);
    expect(first.expectedBundleHash).toBe(second.expectedBundleHash);
    expect(first.bundleId).toBe(second.bundleId);
    expect(first.verificationStatus).toBe("VALID_BUNDLE");
    expect(second.verificationStatus).toBe("VALID_BUNDLE");
  });

  it("returns DISPUTED_BUNDLE for tampered bundle hash or bundle id", () => {
    const hashTampered = tamper(validBundle(), {
      hashes: {
        ...validBundle().hashes,
        bundleHash: "sha256:tampered",
      },
    });
    const idTampered = tamper(validBundle(), { bundleId: "sha256:tampered-id" });

    expect(verifyAdvisoryEvidenceLifecycleBundle(hashTampered).verificationStatus).toBe("DISPUTED_BUNDLE");
    expect(verifyAdvisoryEvidenceLifecycleBundle(hashTampered).reasons).toContain("BUNDLE_HASH_MISMATCH");
    expect(verifyAdvisoryEvidenceLifecycleBundle(idTampered).verificationStatus).toBe("DISPUTED_BUNDLE");
    expect(verifyAdvisoryEvidenceLifecycleBundle(idTampered).reasons).toContain("BUNDLE_ID_MISMATCH");
  });

  it("returns DISPUTED_BUNDLE for unknown policy version and included lifecycle hash mismatch", () => {
    const unknownPolicy = tamper(validBundle(), {
      bundleVersion: "advisory-evidence-lifecycle-export-bundle/v999",
    });
    const missingRollupHash = tamper(validBundle(), {
      hashes: {
        ...validBundle().hashes,
        rollupHash: "",
      },
    });

    expect(verifyAdvisoryEvidenceLifecycleBundle(unknownPolicy).verificationStatus).toBe("DISPUTED_BUNDLE");
    expect(verifyAdvisoryEvidenceLifecycleBundle(unknownPolicy).reasons).toContain("BUNDLE_POLICY_VERSION_UNRECOGNIZED");
    expect(verifyAdvisoryEvidenceLifecycleBundle(missingRollupHash).verificationStatus).toBe("DISPUTED_BUNDLE");
    expect(verifyAdvisoryEvidenceLifecycleBundle(missingRollupHash).reasons).toContain("ROLLUP_HASH_MISMATCH");
  });

  it("returns DISPUTED_BUNDLE for authority leakage, trusted state, live import, and control fields", () => {
    const topAuthorityLeak = tamper(validBundle(), {
      authority: {
        ...validBundle().authority,
        mayDeploy: true,
      },
    });
    const nestedTrustedLeak = validBundle({
      lifecycleRollup: lifecycleRollup({ trusted: true }),
    });
    const nestedImportLeak = validBundle({
      archiveSummary: archiveSummary({ importedToLiveState: true }),
    });
    const nestedControlLeak = validBundle({
      retentionMetadata: retentionMetadata({ mayDelete: true }),
    });

    for (const bundle of [topAuthorityLeak, nestedTrustedLeak, nestedImportLeak, nestedControlLeak]) {
      const result = verifyAdvisoryEvidenceLifecycleBundle(bundle);
      expect(result.verificationStatus).toBe("DISPUTED_BUNDLE");
      expect(result.authority).toBe("READ_ONLY");
      expect(result.trusted).toBe(false);
      expect(result.importedToLiveState).toBe(false);
      expect(result.mayDeploy).toBe(false);
      expect(result.mayDelete).toBe(false);
    }
  });

  it("returns FAILED_BUNDLE for missing or malformed bundles", () => {
    expect(verifyAdvisoryEvidenceLifecycleBundle(null).verificationStatus).toBe("FAILED_BUNDLE");
    expect(verifyAdvisoryEvidenceLifecycleBundle("not-a-bundle").verificationStatus).toBe("FAILED_BUNDLE");
    expect(verifyAdvisoryEvidenceLifecycleBundle({ bundleVersion: "advisory-evidence-lifecycle-export-bundle/v1" }).verificationStatus).toBe("FAILED_BUNDLE");
  });

  it("does not mutate input and returns deterministic verification output", () => {
    const input = validBundle();
    const before = JSON.stringify(input);
    const first = verifyAdvisoryEvidenceLifecycleBundle(input);
    const second = verifyAdvisoryEvidenceLifecycleBundle(input);

    expect(JSON.stringify(input)).toBe(before);
    expect(first).toEqual(second);
    expect(Object.keys(first)).not.toContain("route");
    expect(Object.keys(first)).not.toContain("writePath");
    expect(Object.keys(first)).not.toContain("importPath");
  });
});
