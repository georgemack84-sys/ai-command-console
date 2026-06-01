import { describe, expect, it } from "vitest";

import {
  buildAdvisoryEvidenceLifecycleCompletionReport,
  REQUIRED_ADVISORY_EVIDENCE_LIFECYCLE_SEALS,
  type AdvisoryEvidenceLifecycleCompletionReportInput,
} from "@/services/advisory/advisoryEvidenceLifecycleCompletionReport";

const generatedAt = "2026-05-31T12:00:00.000Z";

function completeInput(overrides: Partial<AdvisoryEvidenceLifecycleCompletionReportInput> = {}): AdvisoryEvidenceLifecycleCompletionReportInput {
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
      { extension: "Completion Attestation Layer", optional: true, blocking: false, authoritative: false },
      { extension: "Operator Documentation Layer", optional: true, blocking: false, authoritative: false },
    ],
    reasons: ["LIFECYCLE_COMPLETE"],
    ...overrides,
  };
}

describe("advisory evidence lifecycle completion report", () => {
  it("returns COMPLETE for a complete sealed lifecycle", () => {
    const result = buildAdvisoryEvidenceLifecycleCompletionReport(completeInput());

    expect(result.completionStatus).toBe("COMPLETE");
    expect(result.completionHash).toMatch(/^sha256:/);
    expect(result.generatedAt).toBe(generatedAt);
    expect(result.sealedCommits.every((seal) => seal.present)).toBe(true);
    expect(result.completedLifecycleStages).toContain("Certification Final Seal");
    expect(result.certificationSummary.certificationStatus).toBe("CERTIFIED");
    expect(result.operatorVisibilitySummary.certificationReviewUiAvailable).toBe(true);
    expect(result.authority).toBe("READ_ONLY");
  });

  it("returns CONDITIONALLY_COMPLETE when optional evidence is missing", () => {
    const result = buildAdvisoryEvidenceLifecycleCompletionReport(completeInput({
      remainingOptionalExtensions: [
        { extension: "Completion Review UI", optional: true, blocking: false, authoritative: false, present: false },
      ],
    }));

    expect(result.completionStatus).toBe("CONDITIONALLY_COMPLETE");
    expect(result.reasons).toContain("OPTIONAL_EXTENSION_PENDING:Completion Review UI");
  });

  it("returns FAILED_COMPLETION when a required seal is missing", () => {
    const result = buildAdvisoryEvidenceLifecycleCompletionReport(completeInput({
      sealedCommits: completeInput().sealedCommits.map((seal) => (
        seal.commit === "70a9d05" ? { ...seal, present: false } : seal
      )),
    }));

    expect(result.completionStatus).toBe("FAILED_COMPLETION");
    expect(result.reasons).toContain("REQUIRED_SEAL_MISSING:Certification Final Seal");
  });

  it("returns DISPUTED_COMPLETION for authority leakage", () => {
    const result = buildAdvisoryEvidenceLifecycleCompletionReport(completeInput({
      evidence: {
        trusted: true,
        importedToLiveState: true,
        mayDeploy: true,
      },
    }));

    expect(result.completionStatus).toBe("DISPUTED_COMPLETION");
    expect(result.reasons).toContain("TRUSTED_STATE_LEAK:completionInput.trusted");
    expect(result.reasons).toContain("LIVE_IMPORT_LEAK:completionInput.importedToLiveState");
    expect(result.reasons).toContain("CONTROL_AUTHORITY_LEAK:completionInput.mayDeploy");
    expect(result.trusted).toBe(false);
    expect(result.importedToLiveState).toBe(false);
    expect(result.mayDeploy).toBe(false);
  });

  it("keeps completion hashes deterministic and excludes generatedAt", () => {
    const first = buildAdvisoryEvidenceLifecycleCompletionReport(completeInput({ generatedAt: "2026-05-31T12:00:00.000Z" }));
    const second = buildAdvisoryEvidenceLifecycleCompletionReport(completeInput({ generatedAt: "2026-06-01T12:00:00.000Z" }));

    expect(first.completionHash).toBe(second.completionHash);
    expect(first.generatedAt).not.toBe(second.generatedAt);
  });

  it("keeps authority fields false and does not mutate input", () => {
    const input = completeInput();
    const before = JSON.stringify(input);
    const result = buildAdvisoryEvidenceLifecycleCompletionReport(input);

    expect(JSON.stringify(input)).toBe(before);
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
});
