import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryEvidenceLifecycleCompletionBundleReviewPanel } from "@/components/advisory/AdvisoryEvidenceLifecycleCompletionBundleReviewPanel";
import type { CompletionBundleVerificationResult } from "@/services/advisory/advisoryEvidenceLifecycleCompletionBundleVerification";

function verification(
  overrides: Partial<CompletionBundleVerificationResult> = {},
): CompletionBundleVerificationResult {
  return {
    verificationStatus: "VALID_COMPLETION_BUNDLE",
    exportId: "sha256:export-id",
    exportHash: "sha256:export-hash",
    expectedExportHash: "sha256:expected-export-hash",
    expectedExportId: "sha256:expected-export-id",
    hashMatches: true,
    idMatches: true,
    policyVersion: "advisory-evidence-lifecycle-completion-export/v1",
    completionSummaryVerified: true,
    certificationSummaryVerified: true,
    sealedCommitsVerified: true,
    guaranteesVerified: true,
    replayable: true,
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
    mayDelete: false,
    mayCompact: false,
    mayArchiveMutate: false,
    mayImportToLiveState: false,
    reasons: [],
    ...overrides,
  };
}

describe("AdvisoryEvidenceLifecycleCompletionBundleReviewPanel", () => {
  it("renders valid completion bundle verification state and required labels", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleCompletionBundleReviewPanel, {
      verification: verification(),
    }));

    expect(screen.getByTestId("advisory-lifecycle-completion-bundle-review-panel")).toHaveTextContent("VALID_COMPLETION_BUNDLE");
    expect(screen.getAllByText("READ_ONLY").length).toBeGreaterThan(0);
    expect(screen.getByText("COMPLETION_BUNDLE_REVIEW_ONLY")).toBeVisible();
    expect(screen.getByText("NOT_TRUSTED")).toBeVisible();
    expect(screen.getByText("NOT_IMPORTED_TO_LIVE_STATE")).toBeVisible();
    expect(screen.getByText("NO_LIFECYCLE_ACTIONS")).toBeVisible();
    expect(screen.getByText("NO_CONTROL_AUTHORITY")).toBeVisible();
    expect(screen.getByText("Completion bundle verified. This does not mark evidence trusted.")).toBeVisible();
  });

  it("renders disputed failed and unknown states safely", () => {
    const { rerender } = render(React.createElement(AdvisoryEvidenceLifecycleCompletionBundleReviewPanel, {
      verification: verification({
        verificationStatus: "DISPUTED_COMPLETION_BUNDLE",
        hashMatches: false,
        idMatches: false,
        replayable: false,
        reasons: ["EXPORT_HASH_MISMATCH"],
      }),
    }));

    expect(screen.getByText("Completion bundle disputed. Review bundle integrity before relying on evidence.")).toBeVisible();
    expect(screen.getByTestId("completion-bundle-reasons")).toHaveTextContent("EXPORT_HASH_MISMATCH");

    rerender(React.createElement(AdvisoryEvidenceLifecycleCompletionBundleReviewPanel, {
      verification: verification({
        verificationStatus: "FAILED_COMPLETION_BUNDLE",
        exportId: null,
        exportHash: null,
        expectedExportHash: null,
        expectedExportId: null,
        hashMatches: false,
        idMatches: false,
        policyVersion: null,
        completionSummaryVerified: false,
        certificationSummaryVerified: false,
        sealedCommitsVerified: false,
        guaranteesVerified: false,
        replayable: false,
        reasons: ["COMPLETION_BUNDLE_MISSING"],
      }),
    }));

    expect(screen.getByText("Completion bundle verification failed. Required completion bundle metadata is missing or malformed.")).toBeVisible();
    expect(screen.getByTestId("completion-bundle-reasons")).toHaveTextContent("COMPLETION_BUNDLE_MISSING");

    rerender(React.createElement(AdvisoryEvidenceLifecycleCompletionBundleReviewPanel, {
      verification: verification({
        verificationStatus: "ODD_STATUS" as CompletionBundleVerificationResult["verificationStatus"],
      }),
    }));

    expect(screen.getByText("UNKNOWN_COMPLETION_BUNDLE")).toBeVisible();
    expect(screen.getByText("Completion bundle verification state is unknown. Review remains read-only.")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows export hash expected export hash export ID and expected export ID", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleCompletionBundleReviewPanel, {
      verification: verification(),
    }));

    const integrity = screen.getByTestId("completion-bundle-integrity-panel");
    expect(integrity).toHaveTextContent("Export hash: sha256:export-hash");
    expect(integrity).toHaveTextContent("Expected export hash: sha256:expected-export-hash");
    expect(integrity).toHaveTextContent("Hash matches: yes");
    expect(integrity).toHaveTextContent("Export ID: sha256:export-id");
    expect(integrity).toHaveTextContent("Expected export ID: sha256:expected-export-id");
    expect(integrity).toHaveTextContent("ID matches: yes");
  });

  it("shows policy version metadata verification booleans and replayability", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleCompletionBundleReviewPanel, {
      verification: verification(),
    }));

    const metadata = screen.getByTestId("completion-bundle-metadata");
    expect(metadata).toHaveTextContent("policy version advisory-evidence-lifecycle-completion-export/v1");
    expect(metadata).toHaveTextContent("completion summary verified true");
    expect(metadata).toHaveTextContent("certification summary verified true");
    expect(metadata).toHaveTextContent("sealed commits verified true");
    expect(metadata).toHaveTextContent("guarantees verified true");
    expect(metadata).toHaveTextContent("replayable true");
  });

  it("shows authority fields and deterministic reasons without mutating input", () => {
    const input = verification({ reasons: ["Z_REASON", "A_REASON"] });
    const before = JSON.stringify(input);
    render(React.createElement(AdvisoryEvidenceLifecycleCompletionBundleReviewPanel, { verification: input }));

    expect(JSON.stringify(input)).toBe(before);
    expect(screen.getByTestId("completion-bundle-authority")).toHaveTextContent("authority READ_ONLY");
    expect(screen.getByTestId("completion-bundle-authority")).toHaveTextContent("trusted false");
    expect(screen.getByTestId("completion-bundle-authority")).toHaveTextContent("imported to live state false");
    expect(screen.getByTestId("completion-bundle-authority")).toHaveTextContent("mayDeploy false");
    expect(screen.getByTestId("completion-bundle-authority")).toHaveTextContent("mayRetry false");
    expect(screen.getByTestId("completion-bundle-authority")).toHaveTextContent("mayRollback false");
    expect(screen.getByTestId("completion-bundle-authority")).toHaveTextContent("mayCancel false");
    expect(screen.getByTestId("completion-bundle-authority")).toHaveTextContent("mayResume false");
    expect(screen.getByTestId("completion-bundle-authority")).toHaveTextContent("mayApprove false");
    expect(screen.getByTestId("completion-bundle-authority")).toHaveTextContent("mayOverride false");
    expect(screen.getByTestId("completion-bundle-authority")).toHaveTextContent("mayDelete false");
    expect(screen.getByTestId("completion-bundle-authority")).toHaveTextContent("mayCompact false");
    expect(screen.getByTestId("completion-bundle-authority")).toHaveTextContent("mayArchiveMutate false");
    expect(screen.getByTestId("completion-bundle-authority")).toHaveTextContent("mayImportToLiveState false");
    expect(within(screen.getByTestId("completion-bundle-reasons")).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "A_REASON",
      "Z_REASON",
    ]);
  });

  it("does not render forbidden controls or mutation paths", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleCompletionBundleReviewPanel, {
      verification: verification(),
    }));

    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
    expect(document.body).not.toHaveTextContent(/Deploy bundle|Retry bundle|Cancel bundle|Rollback bundle|Resume bundle|Approve bundle|Override bundle|Delete bundle|Compact bundle|Import bundle|Trust bundle|Promote to live state|Mark verified|Apply bundle|Save bundle|Upload bundle/i);
  });

  it("does not bypass verification output or recompute hashes internally", () => {
    const root = process.cwd();
    const files = [
      "components/advisory/AdvisoryEvidenceLifecycleCompletionBundleReviewPanel.tsx",
      "components/advisory/AdvisoryEvidenceLifecycleCompletionBundleIntegrityPanel.tsx",
      "components/advisory/AdvisoryEvidenceLifecycleCompletionBundleMetadataPanel.tsx",
    ];
    const source = files.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");

    expect(source).toContain("CompletionBundleVerificationResult");
    expect(source).not.toContain("buildAdvisoryEvidenceLifecycleCompletionExportBundle");
    expect(source).not.toContain("verifyAdvisoryEvidenceLifecycleCompletionBundle");
    expect(source).not.toContain("hashPayloadDeterministically");
    expect(source).not.toContain("AdvisoryEvidenceLifecycleCompletionExportBundle");
    expect(fs.existsSync(path.join(root, "app/api/advisory/completion-bundle/review/route.ts"))).toBe(false);
    expect(fs.existsSync(path.join(root, "app/api/advisory/completion-export"))).toBe(false);
  });
});
