import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildAdvisoryEvidenceLifecycleCompletionExportBundle,
} from "@/services/advisory/advisoryEvidenceLifecycleCompletionExportBundle";
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

function exportBundle(overrides: Parameters<typeof buildAdvisoryEvidenceLifecycleCompletionExportBundle>[0] = {}) {
  return buildAdvisoryEvidenceLifecycleCompletionExportBundle({
    completionReport: completionReport(),
    generatedAt,
    ...overrides,
  });
}

describe("advisory evidence lifecycle completion export bundle", () => {
  it("exports valid lifecycle completion evidence as a read-only portable bundle", () => {
    const report = completionReport();
    const result = exportBundle({ completionReport: report });

    expect(result.exportStatus).toBe("EXPORTED");
    expect(result.exportId).toMatch(/^sha256:/);
    expect(result.exportHash).toMatch(/^sha256:/);
    expect(result.generatedAt).toBe(generatedAt);
    expect(result.completionSummary).toEqual({
      completionStatus: "COMPLETE",
      completionHash: report.completionHash,
    });
    expect(result.certificationSummary).toEqual(report.certificationSummary);
    expect(result.sealedCommits).toEqual(report.sealedCommits);
    expect(result.completedLifecycleStages).toEqual(report.completedLifecycleStages);
    expect(result.guarantees).toEqual(report.guarantees);
    expect(result.operatorVisibilitySummary).toEqual(report.operatorVisibilitySummary);
    expect(result.optionalExtensions).toEqual(report.remainingOptionalExtensions);
    expect(result.exportPolicyVersion).toBe("advisory-evidence-lifecycle-completion-export/v1");
    expect(result.authority).toBe("READ_ONLY");
  });

  it("keeps exportHash and exportId deterministic while excluding generatedAt", () => {
    const report = completionReport({ generatedAt: "2026-05-31T12:00:00.000Z" });
    const first = exportBundle({ completionReport: report, generatedAt: "2026-05-31T12:00:00.000Z" });
    const second = exportBundle({ completionReport: { ...report, generatedAt: "2026-06-01T12:00:00.000Z" }, generatedAt: "2026-06-02T12:00:00.000Z" });

    expect(first.exportHash).toBe(second.exportHash);
    expect(first.exportId).toBe(second.exportId);
    expect(first.generatedAt).not.toBe(second.generatedAt);
  });

  it("changes exportHash when completion evidence changes", () => {
    const base = exportBundle();
    const changed = exportBundle({
      completionReport: completionReport({
        certificationSummary: {
          certificationStatus: "CERTIFIED",
          certificationHash: "sha256:changed-certification",
          certificationCommit: "d8d93d2",
          reviewUiCommit: "bb27912",
          finalSealCommit: "70a9d05",
        },
      }),
    });

    expect(changed.exportHash).not.toBe(base.exportHash);
    expect(changed.exportId).not.toBe(base.exportId);
  });

  it("disputes authority trusted and live import leaks while keeping output safe", () => {
    const leakedReport = {
      ...completionReport(),
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
    };
    const result = exportBundle({ completionReport: leakedReport });

    expect(result.exportStatus).toBe("DISPUTED_EXPORT");
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

  it("fails closed when required completion evidence is missing", () => {
    const missingReport = { ...completionReport() };
    delete (missingReport as Record<string, unknown>).completionHash;
    delete (missingReport as Record<string, unknown>).sealedCommits;

    const result = exportBundle({ completionReport: missingReport });

    expect(result.exportStatus).toBe("FAILED_EXPORT");
    expect(result.completionSummary.completionHash).toBeNull();
    expect(result.sealedCommits).toEqual([]);
    expect(result.reasons).toEqual(expect.arrayContaining([
      "COMPLETION_FIELD_MISSING:completionHash",
      "COMPLETION_FIELD_MISSING:sealedCommits",
    ]));
  });

  it("fails closed when the completion report is absent", () => {
    const result = buildAdvisoryEvidenceLifecycleCompletionExportBundle({ generatedAt });

    expect(result.exportStatus).toBe("FAILED_EXPORT");
    expect(result.completionSummary).toEqual({
      completionStatus: "UNKNOWN",
      completionHash: null,
    });
    expect(result.reasons).toContain("COMPLETION_REPORT_MISSING");
    expect(result.exportHash).toMatch(/^sha256:/);
    expect(result.exportId).toMatch(/^sha256:/);
  });

  it("does not mutate input evidence and does not add route file write or import paths", () => {
    const report = completionReport();
    const before = JSON.stringify(report);
    const result = exportBundle({ completionReport: report });

    expect(JSON.stringify(report)).toBe(before);
    expect(Object.keys(result)).not.toEqual(expect.arrayContaining([
      "route",
      "writePath",
      "downloadPath",
      "importPath",
      "trustedImport",
    ]));
    expect(fs.existsSync(path.join(process.cwd(), "app/api/advisory/completion-export/route.ts"))).toBe(false);
    expect(fs.existsSync(path.join(process.cwd(), "app/api/advisory/completion-export"))).toBe(false);
  });
});
