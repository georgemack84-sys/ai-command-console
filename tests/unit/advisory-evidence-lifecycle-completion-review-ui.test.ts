import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryEvidenceLifecycleCompletionReviewPanel } from "@/components/advisory/AdvisoryEvidenceLifecycleCompletionReviewPanel";
import type { AdvisoryEvidenceLifecycleCompletionReport } from "@/services/advisory/advisoryEvidenceLifecycleCompletionReport";

function completionReport(
  overrides: Partial<AdvisoryEvidenceLifecycleCompletionReport> = {},
): AdvisoryEvidenceLifecycleCompletionReport {
  return {
    completionStatus: "COMPLETE",
    completionHash: "sha256:completion-hash",
    generatedAt: "2026-05-31T12:00:00.000Z",
    sealedCommits: [
      { phase: "Bundle Final Seal", commit: "04a52f1", required: true, present: true },
      { phase: "Certification Gate", commit: "d8d93d2", required: true, present: true },
      { phase: "Certification Review UI", commit: "bb27912", required: true, present: true },
      { phase: "Certification Final Seal", commit: "70a9d05", required: true, present: true },
    ],
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
      { extension: "Completion Review UI", optional: true, blocking: false, authoritative: false, present: true },
      { extension: "Completion Export Bundle", optional: true, blocking: false, authoritative: false, present: false },
    ],
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

describe("AdvisoryEvidenceLifecycleCompletionReviewPanel", () => {
  it("renders COMPLETE lifecycle completion state and required labels", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleCompletionReviewPanel, {
      report: completionReport(),
    }));

    expect(screen.getByTestId("advisory-lifecycle-completion-review-panel")).toHaveTextContent("COMPLETE");
    expect(screen.getAllByText("READ_ONLY").length).toBeGreaterThan(0);
    expect(screen.getByText("COMPLETION_REVIEW_ONLY")).toBeVisible();
    expect(screen.getByText("NOT_TRUSTED")).toBeVisible();
    expect(screen.getByText("NOT_IMPORTED_TO_LIVE_STATE")).toBeVisible();
    expect(screen.getByText("NO_LIFECYCLE_ACTIONS")).toBeVisible();
    expect(screen.getByText("NO_CONTROL_AUTHORITY")).toBeVisible();
    expect(screen.getByText("Advisory evidence lifecycle completion verified.")).toBeVisible();
  });

  it("renders conditional disputed failed and unknown states safely", () => {
    const { rerender } = render(React.createElement(AdvisoryEvidenceLifecycleCompletionReviewPanel, {
      report: completionReport({
        completionStatus: "CONDITIONALLY_COMPLETE",
        reasons: ["OPTIONAL_EXTENSION_PENDING:Completion Export Bundle"],
      }),
    }));

    expect(screen.getByText("Advisory evidence lifecycle completion available with warnings.")).toBeVisible();
    expect(screen.getByTestId("completion-reasons")).toHaveTextContent("OPTIONAL_EXTENSION_PENDING:Completion Export Bundle");

    rerender(React.createElement(AdvisoryEvidenceLifecycleCompletionReviewPanel, {
      report: completionReport({ completionStatus: "DISPUTED_COMPLETION", reasons: ["CONTROL_AUTHORITY_LEAK:evidence.mayDeploy"] }),
    }));
    expect(screen.getByText("Advisory evidence lifecycle completion disputed.")).toBeVisible();

    rerender(React.createElement(AdvisoryEvidenceLifecycleCompletionReviewPanel, {
      report: completionReport({ completionStatus: "FAILED_COMPLETION", reasons: ["REQUIRED_SEAL_MISSING:Certification Final Seal"] }),
    }));
    expect(screen.getByText("Advisory evidence lifecycle completion failed.")).toBeVisible();

    rerender(React.createElement(AdvisoryEvidenceLifecycleCompletionReviewPanel, {
      report: completionReport({
        completionStatus: "ODD_STATUS" as AdvisoryEvidenceLifecycleCompletionReport["completionStatus"],
      }),
    }));
    expect(screen.getByText("UNKNOWN_COMPLETION")).toBeVisible();
    expect(screen.getByText("Advisory evidence lifecycle completion state is unknown. Review remains read-only.")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows completion hash sealed commits and lifecycle stages", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleCompletionReviewPanel, {
      report: completionReport(),
    }));

    expect(screen.getByTestId("completion-hash-panel")).toHaveTextContent("sha256:completion-hash");
    expect(screen.getByTestId("completion-sealed-commits")).toHaveTextContent("Certification Final Seal");
    expect(screen.getByTestId("completion-sealed-commits")).toHaveTextContent("70a9d05");
    expect(screen.getByTestId("completion-stages")).toHaveTextContent("Bundle Verification");
    expect(screen.getByTestId("completion-stages")).toHaveTextContent("Certification Final Seal");
  });

  it("shows guarantees certification summary operator visibility and optional extensions", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleCompletionReviewPanel, {
      report: completionReport(),
    }));

    expect(screen.getByTestId("completion-guarantees-panel")).toHaveTextContent("Deterministic: true");
    expect(screen.getByTestId("completion-guarantees-panel")).toHaveTextContent("Read only: true");
    expect(screen.getByTestId("completion-guarantees-panel")).toHaveTextContent("Replayable: true");
    expect(screen.getByTestId("completion-guarantees-panel")).toHaveTextContent("Operator visible: true");
    expect(screen.getByTestId("completion-guarantees-panel")).toHaveTextContent("Authority contained: true");
    expect(screen.getByTestId("completion-guarantees-panel")).toHaveTextContent("Trusted state absent: true");
    expect(screen.getByTestId("completion-guarantees-panel")).toHaveTextContent("Live import absent: true");
    expect(screen.getByTestId("completion-guarantees-panel")).toHaveTextContent("Workflow control absent: true");
    expect(screen.getByTestId("completion-certification-summary")).toHaveTextContent("CERTIFIED");
    expect(screen.getByTestId("completion-certification-summary")).toHaveTextContent("sha256:certification");
    expect(screen.getByTestId("completion-certification-summary")).toHaveTextContent("d8d93d2");
    expect(screen.getByTestId("completion-certification-summary")).toHaveTextContent("bb27912");
    expect(screen.getByTestId("completion-certification-summary")).toHaveTextContent("70a9d05");
    expect(screen.getByTestId("completion-operator-visibility")).toHaveTextContent("dashboard available true");
    expect(screen.getByTestId("completion-operator-visibility")).toHaveTextContent("review UI available true");
    expect(screen.getByTestId("completion-operator-visibility")).toHaveTextContent("certification review UI available true");
    expect(screen.getByTestId("completion-operator-visibility")).toHaveTextContent("archive UI available true");
    expect(screen.getByTestId("completion-optional-extensions")).toHaveTextContent("Completion Export Bundle");
    expect(screen.getByTestId("completion-optional-extensions")).toHaveTextContent("authoritative false");
  });

  it("shows authority containment fields and deterministic reasons without mutating input", () => {
    const input = completionReport({ reasons: ["Z_REASON", "A_REASON"] });
    const before = JSON.stringify(input);
    render(React.createElement(AdvisoryEvidenceLifecycleCompletionReviewPanel, { report: input }));

    expect(JSON.stringify(input)).toBe(before);
    expect(screen.getByTestId("completion-authority-panel")).toHaveTextContent("trusted false");
    expect(screen.getByTestId("completion-authority-panel")).toHaveTextContent("imported to live state false");
    expect(screen.getByTestId("completion-authority-panel")).toHaveTextContent("mayDeploy false");
    expect(screen.getByTestId("completion-authority-panel")).toHaveTextContent("mayRetry false");
    expect(screen.getByTestId("completion-authority-panel")).toHaveTextContent("mayRollback false");
    expect(screen.getByTestId("completion-authority-panel")).toHaveTextContent("mayCancel false");
    expect(screen.getByTestId("completion-authority-panel")).toHaveTextContent("mayResume false");
    expect(screen.getByTestId("completion-authority-panel")).toHaveTextContent("mayApprove false");
    expect(screen.getByTestId("completion-authority-panel")).toHaveTextContent("mayOverride false");
    expect(screen.getByTestId("completion-authority-panel")).toHaveTextContent("mayDelete false");
    expect(screen.getByTestId("completion-authority-panel")).toHaveTextContent("mayCompact false");
    expect(screen.getByTestId("completion-authority-panel")).toHaveTextContent("mayArchiveMutate false");
    expect(screen.getByTestId("completion-authority-panel")).toHaveTextContent("mayImportToLiveState false");
    expect(within(screen.getByTestId("completion-reasons")).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "A_REASON",
      "Z_REASON",
    ]);
  });

  it("does not render forbidden controls or hidden mutation paths", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleCompletionReviewPanel, {
      report: completionReport(),
    }));

    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
    expect(document.body).not.toHaveTextContent(/Deploy completion|Retry completion|Cancel completion|Rollback completion|Resume completion|Approve completion|Override completion|Delete completion|Compact completion|Import completion|Trust completion|Promote to live state|Mark complete|Apply completion|Save completion|Upload completion/i);
  });

  it("consumes completion report objects without rebuilding completion evidence", () => {
    const sourceFiles = [
      "components/advisory/AdvisoryEvidenceLifecycleCompletionReviewPanel.tsx",
      "components/advisory/AdvisoryEvidenceLifecycleCompletionGuaranteesPanel.tsx",
      "components/advisory/AdvisoryEvidenceLifecycleCompletionChainPanel.tsx",
    ].map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8"));

    for (const source of sourceFiles) {
      expect(source).toContain("AdvisoryEvidenceLifecycleCompletionReport");
      expect(source).not.toContain("buildAdvisoryEvidenceLifecycleCompletionReport");
      expect(source).not.toContain("hashPayloadDeterministically");
      expect(source).not.toContain("certifyAdvisoryEvidenceLifecycle");
    }

    expect(fs.existsSync(path.join(process.cwd(), "app/api/advisory/completion-review/route.ts"))).toBe(false);
    expect(fs.existsSync(path.join(process.cwd(), "app/api/advisory/completion-report/route.ts"))).toBe(false);
  });
});
