import { describe, expect, it } from "vitest";

import {
  classifyAdvisoryEvidenceRetention,
} from "@/services/advisory/advisoryEvidenceRetentionPolicy";
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
    evidenceRef: "advisory-snapshot:release-2026-05-29",
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

describe("advisory evidence retention policy", () => {
  it("classifies valid evidence as RETAIN with deterministic metadata", () => {
    const result = classifyAdvisoryEvidenceRetention(entry(), {
      retentionClass: "STANDARD",
      retentionUntil: "2026-08-29T12:00:00.000Z",
    });

    expect(result.retentionStatus).toBe("RETAIN");
    expect(result.referenceHash).toBe("sha256:reference");
    expect(result.snapshotHash).toBe("sha256:snapshot");
    expect(result.retentionClass).toBe("STANDARD");
    expect(result.retentionUntil).toBe("2026-08-29T12:00:00.000Z");
    expect(result.reviewRequired).toBe(false);
    expect(result.policyVersion).toBe("advisory-evidence-retention/v1");
    expect(result.retentionReason).toContain("RETENTION_CLASS_STANDARD");
    expect(result.authority).toBe("READ_ONLY");
  });

  it("returns REVIEW_RETENTION for ambiguous retention metadata", () => {
    const result = classifyAdvisoryEvidenceRetention(entry(), {
      retentionClass: "REVIEW_REQUIRED",
      retentionUntil: null,
    });

    expect(result.retentionStatus).toBe("REVIEW_RETENTION");
    expect(result.reviewRequired).toBe(true);
    expect(result.reasons).toContain("RETENTION_REVIEW_REQUIRED");
    expect(result.reasons).toContain("RETENTION_UNTIL_MISSING");
  });

  it("disputes authority leakage and invalid policy versions", () => {
    const authorityLeak = classifyAdvisoryEvidenceRetention({
      ...entry(),
      mayDeploy: true,
    }, { retentionClass: "STANDARD" });
    const invalidPolicy = classifyAdvisoryEvidenceRetention(entry({ policyVersion: "unexpected-policy/v9" }), {
      retentionClass: "STANDARD",
    });

    expect(authorityLeak.retentionStatus).toBe("RETENTION_DISPUTED");
    expect(authorityLeak.reasons).toContain("CONTROL_AUTHORITY_LEAK:mayDeploy");
    expect(authorityLeak.mayDelete).toBe(false);
    expect(invalidPolicy.retentionStatus).toBe("RETENTION_DISPUTED");
    expect(invalidPolicy.reasons).toContain("SOURCE_POLICY_VERSION_UNRECOGNIZED");
  });

  it("fails safely for malformed input and missing archive reference", () => {
    const malformed = classifyAdvisoryEvidenceRetention("not-an-entry");
    const missingReference = classifyAdvisoryEvidenceRetention(entry({ referenceHash: "" }));

    expect(malformed.retentionStatus).toBe("RETENTION_FAILED");
    expect(malformed.reasons).toContain("ARCHIVE_REFERENCE_MALFORMED");
    expect(missingReference.retentionStatus).toBe("RETENTION_FAILED");
    expect(missingReference.reasons).toContain("REFERENCE_HASH_MISSING");
  });

  it("hashes deterministically and excludes generated timestamps", () => {
    const first = classifyAdvisoryEvidenceRetention(entry(), {
      evaluatedAt: "2026-05-29T12:00:00.000Z",
      retentionClass: "LONG_TERM",
    });
    const second = classifyAdvisoryEvidenceRetention(entry(), {
      evaluatedAt: "2026-06-01T12:00:00.000Z",
      retentionClass: "LONG_TERM",
    });

    expect(first.retentionHash).toBe(second.retentionHash);
    expect(first.evaluatedAt).not.toBe(second.evaluatedAt);
  });

  it("keeps trust import mutation and lifecycle authority disabled", () => {
    const input = entry();
    const before = JSON.stringify(input);
    const result = classifyAdvisoryEvidenceRetention(input);

    expect(JSON.stringify(input)).toBe(before);
    expect(result.trusted).toBe(false);
    expect(result.importedToLiveState).toBe(false);
    expect(result.mayDelete).toBe(false);
    expect(result.mayCompact).toBe(false);
    expect(result.mayArchiveMutate).toBe(false);
    expect(result.mayImportToLiveState).toBe(false);
  });
});
