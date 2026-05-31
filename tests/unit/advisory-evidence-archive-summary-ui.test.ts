import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryEvidenceArchiveSummaryPanel } from "@/components/advisory/AdvisoryEvidenceArchiveSummaryPanel";
import type { AdvisoryEvidenceArchiveSummary } from "@/services/advisory/advisoryEvidenceArchiveSummary";

function summary(overrides: Partial<AdvisoryEvidenceArchiveSummary> = {}): AdvisoryEvidenceArchiveSummary {
  return {
    summaryStatus: "SUMMARIZED",
    totalEntries: 3,
    counts: {
      indexed: 1,
      disputed: 1,
      failed: 1,
      unknown: 0,
    },
    bySource: [
      { source: "EXPORTED_SNAPSHOT", count: 1 },
      { source: "OFFLINE_REVIEW", count: 2 },
    ],
    disputedReferences: [
      { referenceHash: "sha256:disputed", reason: "REVIEW_DISPUTED" },
    ],
    failedReferences: [
      { referenceHash: "sha256:failed", reason: "REVIEW_FAILED" },
    ],
    evidenceCoverage: {
      withSnapshotId: 3,
      withSnapshotHash: 2,
      withPolicyVersion: 3,
      withEvidenceRef: 3,
    },
    summaryHash: "sha256:summary",
    generatedAt: "2026-05-29T12:00:00.000Z",
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
    reasons: ["DISPUTED_REFERENCE_PRESENT"],
    ...overrides,
  };
}

describe("AdvisoryEvidenceArchiveSummaryPanel", () => {
  it("renders SUMMARIZED summary counts coverage labels hash and authority state", () => {
    render(React.createElement(AdvisoryEvidenceArchiveSummaryPanel, {
      summary: summary({ summaryStatus: "SUMMARIZED", reasons: [] }),
    }));

    expect(screen.getByTestId("archive-summary-ui")).toHaveTextContent("Archive Summary");
    expect(screen.getByText("READ_ONLY")).toBeVisible();
    expect(screen.getByText("SUMMARY_ONLY")).toBeVisible();
    expect(screen.getByText("NOT_TRUSTED")).toBeVisible();
    expect(screen.getByText("NOT_IMPORTED_TO_LIVE_STATE")).toBeVisible();
    expect(screen.getByText("NO_CONTROL_AUTHORITY")).toBeVisible();
    expect(screen.getByText("Archive summary available. This does not mark evidence trusted.")).toBeVisible();
    expect(screen.getByTestId("archive-status-counts")).toHaveTextContent("3 total entries");
    expect(screen.getByTestId("archive-status-counts")).toHaveTextContent("1 indexed");
    expect(screen.getByTestId("archive-status-counts")).toHaveTextContent("1 disputed");
    expect(screen.getByTestId("archive-status-counts")).toHaveTextContent("1 failed");
    expect(screen.getByTestId("archive-status-counts")).toHaveTextContent("0 unknown");
    expect(screen.getByTestId("archive-source-coverage")).toHaveTextContent("EXPORTED_SNAPSHOT");
    expect(screen.getByTestId("archive-source-coverage")).toHaveTextContent("OFFLINE_REVIEW");
    expect(screen.getByTestId("archive-evidence-coverage")).toHaveTextContent("3 with snapshot ID");
    expect(screen.getByTestId("archive-evidence-coverage")).toHaveTextContent("2 with snapshot hash");
    expect(screen.getByTestId("archive-evidence-coverage")).toHaveTextContent("3 with policy version");
    expect(screen.getByTestId("archive-evidence-coverage")).toHaveTextContent("3 with evidence ref");
    expect(screen.getByText("sha256:summary")).toBeVisible();
    expect(screen.getByText("2026-05-29T12:00:00.000Z")).toBeVisible();
    expect(screen.getByTestId("archive-authority-state")).toHaveTextContent("trusted false");
    expect(screen.getByTestId("archive-authority-state")).toHaveTextContent("imported to live state false");
  });

  it("renders DISPUTED_SUMMARY disputed references and reasons", () => {
    render(React.createElement(AdvisoryEvidenceArchiveSummaryPanel, {
      summary: summary({ summaryStatus: "DISPUTED_SUMMARY" }),
    }));

    expect(screen.getByText("Archive summary disputed. Review disputed references before relying on evidence.")).toBeVisible();
    expect(screen.getByTestId("archive-disputed-references")).toHaveTextContent("sha256:disputed");
    expect(screen.getByTestId("archive-disputed-references")).toHaveTextContent("REVIEW_DISPUTED");
    expect(screen.getByTestId("archive-reasons")).toHaveTextContent("DISPUTED_REFERENCE_PRESENT");
  });

  it("renders FAILED_SUMMARY failed references safely", () => {
    render(React.createElement(AdvisoryEvidenceArchiveSummaryPanel, {
      summary: summary({ summaryStatus: "FAILED_SUMMARY", reasons: ["ARCHIVE_ENTRIES_MISSING"] }),
    }));

    expect(screen.getByText("Archive summary failed. Required archive data is missing or malformed.")).toBeVisible();
    expect(screen.getByTestId("archive-failed-references")).toHaveTextContent("sha256:failed");
    expect(screen.getByTestId("archive-failed-references")).toHaveTextContent("REVIEW_FAILED");
    expect(screen.getByTestId("archive-reasons")).toHaveTextContent("ARCHIVE_ENTRIES_MISSING");
  });

  it("renders unknown summary status safely without controls", () => {
    render(React.createElement(AdvisoryEvidenceArchiveSummaryPanel, {
      summary: summary({ summaryStatus: "ODD_SUMMARY" as AdvisoryEvidenceArchiveSummary["summaryStatus"] }),
    }));

    expect(screen.getByText("UNKNOWN_SUMMARY")).toBeVisible();
    expect(screen.getByText("Archive summary state is unknown. No trust or control authority is available.")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
  });

  it("does not render forbidden controls or mutate input", () => {
    const value = summary();
    const before = JSON.stringify(value);
    render(React.createElement(AdvisoryEvidenceArchiveSummaryPanel, { summary: value }));

    expect(JSON.stringify(value)).toBe(before);
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
    expect(document.body).not.toHaveTextContent(/Trust evidence|Import evidence|Approve evidence|Override evidence|Deploy evidence|Retry evidence|Cancel evidence|Rollback evidence|Resume evidence|Promote to live state|Save summary|Upload summary|Mark trusted|Apply summary/i);
  });
});
