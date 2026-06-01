import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildAdvisoryEvidenceLifecycleCompletionExportBundle,
} from "@/services/advisory/advisoryEvidenceLifecycleCompletionExportBundle";
import {
  verifyAdvisoryEvidenceLifecycleCompletionBundle,
} from "@/services/advisory/advisoryEvidenceLifecycleCompletionBundleVerification";
import {
  buildAdvisoryEvidenceLifecycleCompletionReport,
  REQUIRED_ADVISORY_EVIDENCE_LIFECYCLE_SEALS,
  type AdvisoryEvidenceLifecycleCompletionReportInput,
} from "@/services/advisory/advisoryEvidenceLifecycleCompletionReport";

const generatedAt = "2026-05-31T12:00:00.000Z";

function completionInput(
  overrides: Partial<AdvisoryEvidenceLifecycleCompletionReportInput> = {},
): AdvisoryEvidenceLifecycleCompletionReportInput {
  return {
    generatedAt,
    sealedCommits: REQUIRED_ADVISORY_EVIDENCE_LIFECYCLE_SEALS.map((seal) => ({
      ...seal,
      present: true,
    })),
    completedLifecycleStages: [
      "Unified Advisory Aggregation",
      "Read Model / Dashboard",
      "Snapshot Export",
      "Snapshot Verification",
      "Offline Review",
      "Archive Chain",
      "Retention Chain",
      "Lifecycle Rollup",
      "Export Bundle",
      "Bundle Verification",
      "Bundle Review UI",
      "Bundle Final Seal",
      "Certification Gate",
      "Certification Review UI",
      "Certification Final Seal",
    ],
    guarantees: {
      deterministic: true,
      readOnly: true,
      replayable: true,
      operatorVisible: true,
      authorityContained: true,
      nonAuthoritative: true,
      nonMutating: true,
      trustedStateAbsent: true,
      liveImportAbsent: true,
      workflowControlAbsent: true,
    },
    certificationSummary: {
      certificationStatus: "CERTIFIED",
      certificationHash: "sha256:certification",
      certificationCommit: "d8d93d2",
      reviewUiCommit: "bb27912",
      finalSealCommit: "70a9d05",
    },
    operatorVisibilitySummary: {
      dashboardAvailable: true,
      reviewUiAvailable: true,
      certificationReviewUiAvailable: true,
      archiveUiAvailable: true,
    },
    remainingOptionalExtensions: [
      { extension: "Completion Review UI", optional: true, blocking: false, authoritative: false },
      { extension: "Completion Export Bundle", optional: true, blocking: false, authoritative: false },
    ],
    reasons: ["LIFECYCLE_COMPLETE"],
    ...overrides,
  };
}

function completionReport(overrides: Partial<AdvisoryEvidenceLifecycleCompletionReportInput> = {}) {
  return buildAdvisoryEvidenceLifecycleCompletionReport(completionInput(overrides));
}

function completionBundle(overrides: Parameters<typeof buildAdvisoryEvidenceLifecycleCompletionExportBundle>[0] = {}) {
  return buildAdvisoryEvidenceLifecycleCompletionExportBundle({
    completionReport: completionReport(),
    generatedAt,
    ...overrides,
  });
}

describe("advisory evidence lifecycle completion bundle verification", () => {
  it("returns VALID_COMPLETION_BUNDLE for a valid exported completion bundle", () => {
    const bundle = completionBundle();
    const result = verifyAdvisoryEvidenceLifecycleCompletionBundle({ bundle });

    expect(result.verificationStatus).toBe("VALID_COMPLETION_BUNDLE");
    expect(result.exportHash).toBe(bundle.exportHash);
    expect(result.exportId).toBe(bundle.exportId);
    expect(result.expectedExportHash).toBe(bundle.exportHash);
    expect(result.expectedExportId).toBe(bundle.exportId);
    expect(result.hashMatches).toBe(true);
    expect(result.idMatches).toBe(true);
    expect(result.policyVersion).toBe("advisory-evidence-lifecycle-completion-export/v1");
    expect(result.completionSummaryVerified).toBe(true);
    expect(result.certificationSummaryVerified).toBe(true);
    expect(result.sealedCommitsVerified).toBe(true);
    expect(result.guaranteesVerified).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("recomputes exportHash and exportId deterministically while ignoring generatedAt", () => {
    const bundle = completionBundle({ generatedAt: "2026-05-31T12:00:00.000Z" });
    const first = verifyAdvisoryEvidenceLifecycleCompletionBundle({ bundle });
    const second = verifyAdvisoryEvidenceLifecycleCompletionBundle({
      bundle: {
        ...bundle,
        generatedAt: "2026-06-02T12:00:00.000Z",
      },
    });

    expect(first.expectedExportHash).toBe(second.expectedExportHash);
    expect(first.expectedExportId).toBe(second.expectedExportId);
    expect(first.verificationStatus).toBe("VALID_COMPLETION_BUNDLE");
    expect(second.verificationStatus).toBe("VALID_COMPLETION_BUNDLE");
  });

  it("disputes tampered exportHash", () => {
    const result = verifyAdvisoryEvidenceLifecycleCompletionBundle({
      bundle: {
        ...completionBundle(),
        exportHash: "sha256:tampered",
      },
    });

    expect(result.verificationStatus).toBe("DISPUTED_COMPLETION_BUNDLE");
    expect(result.hashMatches).toBe(false);
    expect(result.idMatches).toBe(true);
    expect(result.reasons).toContain("EXPORT_HASH_MISMATCH");
  });

  it("disputes tampered exportId", () => {
    const result = verifyAdvisoryEvidenceLifecycleCompletionBundle({
      bundle: {
        ...completionBundle(),
        exportId: "sha256:tampered",
      },
    });

    expect(result.verificationStatus).toBe("DISPUTED_COMPLETION_BUNDLE");
    expect(result.hashMatches).toBe(true);
    expect(result.idMatches).toBe(false);
    expect(result.reasons).toContain("EXPORT_ID_MISMATCH");
  });

  it("disputes unknown policy versions", () => {
    const result = verifyAdvisoryEvidenceLifecycleCompletionBundle({
      bundle: {
        ...completionBundle(),
        exportPolicyVersion: "unknown/v1",
      },
    });

    expect(result.verificationStatus).toBe("DISPUTED_COMPLETION_BUNDLE");
    expect(result.policyVersion).toBe("unknown/v1");
    expect(result.hashMatches).toBe(false);
    expect(result.idMatches).toBe(false);
    expect(result.reasons).toEqual(expect.arrayContaining([
      "UNKNOWN_POLICY_VERSION:unknown/v1",
      "EXPORT_HASH_MISMATCH",
      "EXPORT_ID_MISMATCH",
    ]));
  });

  it("disputes authority leaks while keeping verifier output safe", () => {
    const result = verifyAdvisoryEvidenceLifecycleCompletionBundle({
      bundle: {
        ...completionBundle(),
        authority: "EXECUTE",
        trusted: true,
        importedToLiveState: true,
        mayDeploy: true,
        mayRetry: true,
        mayRollback: true,
        mayCancel: true,
        mayResume: true,
        mayApprove: true,
        mayOverride: true,
        mayDelete: true,
        mayCompact: true,
        mayArchiveMutate: true,
        mayImportToLiveState: true,
      },
    });

    expect(result.verificationStatus).toBe("DISPUTED_COMPLETION_BUNDLE");
    expect(result.reasons).toEqual(expect.arrayContaining([
      "AUTHORITY_NOT_READ_ONLY",
      "TRUSTED_STATE_LEAK:trusted",
      "LIVE_IMPORT_LEAK:importedToLiveState",
      "CONTROL_AUTHORITY_LEAK:mayDeploy",
      "CONTROL_AUTHORITY_LEAK:mayRetry",
      "CONTROL_AUTHORITY_LEAK:mayRollback",
      "CONTROL_AUTHORITY_LEAK:mayCancel",
      "CONTROL_AUTHORITY_LEAK:mayResume",
      "CONTROL_AUTHORITY_LEAK:mayApprove",
      "CONTROL_AUTHORITY_LEAK:mayOverride",
      "CONTROL_AUTHORITY_LEAK:mayDelete",
      "CONTROL_AUTHORITY_LEAK:mayCompact",
      "CONTROL_AUTHORITY_LEAK:mayArchiveMutate",
      "CONTROL_AUTHORITY_LEAK:mayImportToLiveState",
    ]));
    expect(result.authority).toBe("READ_ONLY");
    expect(result.trusted).toBe(false);
    expect(result.importedToLiveState).toBe(false);
    expect(result.mayDeploy).toBe(false);
    expect(result.mayRetry).toBe(false);
    expect(result.mayRollback).toBe(false);
    expect(result.mayCancel).toBe(false);
    expect(result.mayResume).toBe(false);
    expect(result.mayApprove).toBe(false);
    expect(result.mayOverride).toBe(false);
    expect(result.mayDelete).toBe(false);
    expect(result.mayCompact).toBe(false);
    expect(result.mayArchiveMutate).toBe(false);
    expect(result.mayImportToLiveState).toBe(false);
  });

  it("fails closed for missing and malformed bundles", () => {
    const missing = verifyAdvisoryEvidenceLifecycleCompletionBundle({});
    const malformed = verifyAdvisoryEvidenceLifecycleCompletionBundle({ bundle: "not-a-bundle" });

    expect(missing.verificationStatus).toBe("FAILED_COMPLETION_BUNDLE");
    expect(missing.exportHash).toBeNull();
    expect(missing.exportId).toBeNull();
    expect(missing.expectedExportHash).toBeNull();
    expect(missing.expectedExportId).toBeNull();
    expect(missing.reasons).toContain("COMPLETION_BUNDLE_MISSING");
    expect(malformed.verificationStatus).toBe("FAILED_COMPLETION_BUNDLE");
    expect(malformed.reasons).toContain("COMPLETION_BUNDLE_MISSING");
  });

  it("fails closed when required fields are absent", () => {
    const bundle = { ...completionBundle() };
    delete (bundle as Record<string, unknown>).exportHash;
    delete (bundle as Record<string, unknown>).completionSummary;

    const result = verifyAdvisoryEvidenceLifecycleCompletionBundle({ bundle });

    expect(result.verificationStatus).toBe("FAILED_COMPLETION_BUNDLE");
    expect(result.exportHash).toBeNull();
    expect(result.expectedExportHash).toBeNull();
    expect(result.completionSummaryVerified).toBe(false);
    expect(result.reasons).toEqual(expect.arrayContaining([
      "BUNDLE_FIELD_MISSING:exportHash",
      "BUNDLE_FIELD_MISSING:completionSummary",
    ]));
  });

  it("disputes invalid completion metadata without mutating input", () => {
    const bundle = {
      ...completionBundle(),
      completionSummary: { completionStatus: "COMPLETE", completionHash: null },
      certificationSummary: {},
      sealedCommits: [],
      guarantees: { deterministic: true },
    };
    const before = JSON.stringify(bundle);
    const result = verifyAdvisoryEvidenceLifecycleCompletionBundle({ bundle });

    expect(JSON.stringify(bundle)).toBe(before);
    expect(result.verificationStatus).toBe("DISPUTED_COMPLETION_BUNDLE");
    expect(result.completionSummaryVerified).toBe(false);
    expect(result.certificationSummaryVerified).toBe(false);
    expect(result.sealedCommitsVerified).toBe(false);
    expect(result.guaranteesVerified).toBe(false);
    expect(result.reasons).toEqual(expect.arrayContaining([
      "COMPLETION_SUMMARY_INVALID",
      "CERTIFICATION_SUMMARY_INVALID",
      "SEALED_COMMITS_INVALID",
      "GUARANTEES_INVALID",
    ]));
  });

  it("keeps verification deterministic and adds no API route or live-state path", () => {
    const bundle = completionBundle();
    const first = verifyAdvisoryEvidenceLifecycleCompletionBundle({ bundle });
    const second = verifyAdvisoryEvidenceLifecycleCompletionBundle({ bundle });

    expect(first).toEqual(second);
    expect(Object.keys(first)).not.toEqual(expect.arrayContaining([
      "route",
      "writePath",
      "importPath",
      "trustedImport",
      "liveAdvisoryState",
    ]));
    expect(fs.existsSync(path.join(process.cwd(), "app/api/advisory/completion-bundle/verify/route.ts"))).toBe(false);
    expect(fs.existsSync(path.join(process.cwd(), "app/api/advisory/completion-export"))).toBe(false);
  });
});
