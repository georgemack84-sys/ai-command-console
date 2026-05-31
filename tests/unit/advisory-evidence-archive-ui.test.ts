import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryEvidenceArchivePanel } from "@/components/advisory/AdvisoryEvidenceArchivePanel";
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

describe("AdvisoryEvidenceArchivePanel", () => {
  it("renders archive reference labels and indexed entries", () => {
    render(React.createElement(AdvisoryEvidenceArchivePanel, { entries: [entry()] }));

    expect(screen.getByTestId("advisory-evidence-archive-panel")).toHaveTextContent("Advisory evidence archive");
    expect(screen.getByTestId("advisory-lifecycle-rollup-panel")).toHaveTextContent("Lifecycle Summary");
    expect(screen.getByTestId("advisory-lifecycle-rollup-panel")).toHaveTextContent("LIFECYCLE_ROLLUP_ONLY");
    expect(screen.getByTestId("advisory-retention-policy-panel")).toHaveTextContent("Retention Summary");
    expect(screen.getByTestId("advisory-retention-policy-panel")).toHaveTextContent("RETENTION_METADATA_ONLY");
    expect(screen.getAllByText("READ_ONLY").length).toBeGreaterThan(0);
    expect(screen.getByText("ARCHIVE_REFERENCE_ONLY")).toBeVisible();
    expect(screen.getAllByText("NOT_TRUSTED").length).toBeGreaterThan(0);
    expect(screen.getAllByText("NOT_IMPORTED_TO_LIVE_STATE").length).toBeGreaterThan(0);
    expect(screen.getAllByText("NO_CONTROL_AUTHORITY").length).toBeGreaterThan(0);
    expect(screen.getByText("Reference indexed. This does not mark evidence trusted.")).toBeVisible();
    expect(screen.getByTestId("archive-reference-table")).toHaveTextContent("sha256:reference");
    expect(screen.getByTestId("archive-reference-table")).toHaveTextContent("sha256:id");
    expect(screen.getByTestId("archive-reference-table")).toHaveTextContent("sha256:snapshot");
    expect(screen.getByTestId("archive-reference-table")).toHaveTextContent("REVIEWABLE");
    expect(screen.getByTestId("archive-reference-table")).toHaveTextContent("VALID");
  });

  it("renders disputed failed and unknown states safely", () => {
    render(React.createElement(AdvisoryEvidenceArchivePanel, {
      entries: [
        entry({
          archiveStatus: "DISPUTED_REFERENCE",
          referenceHash: "sha256:disputed",
          evidenceRef: "advisory-snapshot:disputed",
          reviewStatus: "DISPUTED_REVIEW",
          verificationStatus: "DISPUTED",
          reasons: ["REVIEW_DISPUTED"],
        }),
        entry({
          archiveStatus: "FAILED_REFERENCE",
          referenceHash: "sha256:failed",
          evidenceRef: "advisory-snapshot:failed",
          reviewStatus: "FAILED_REVIEW",
          verificationStatus: "FAILED",
          reasons: ["REVIEW_FAILED"],
        }),
        entry({
          archiveStatus: "UNKNOWN_REFERENCE" as AdvisoryEvidenceArchiveEntry["archiveStatus"],
          referenceHash: "sha256:unknown",
          evidenceRef: "advisory-snapshot:unknown",
          reasons: ["UNKNOWN_REFERENCE"],
        }),
      ],
    }));

    expect(screen.getByText("Reference disputed. Review before relying on this evidence.")).toBeVisible();
    expect(screen.getByText("Reference failed. Required evidence metadata is missing or malformed.")).toBeVisible();
    expect(screen.getAllByText("UNKNOWN_REFERENCE").length).toBeGreaterThan(0);
    expect(screen.getByTestId("archive-reference-details")).toHaveTextContent("REVIEW_DISPUTED");
    expect(screen.getByTestId("archive-reference-details")).toHaveTextContent("REVIEW_FAILED");
  });

  it("shows details reasons and status counts deterministically", () => {
    render(React.createElement(AdvisoryEvidenceArchivePanel, {
      entries: [
        entry({ archiveStatus: "FAILED_REFERENCE", referenceHash: "sha256:c", evidenceRef: "c", reasons: ["C_REASON"] }),
        entry({ archiveStatus: "INDEXED", referenceHash: "sha256:a", evidenceRef: "a", reasons: ["A_REASON"] }),
        entry({ archiveStatus: "DISPUTED_REFERENCE", referenceHash: "sha256:b", evidenceRef: "b", reasons: ["B_REASON"] }),
      ],
    }));

    expect(screen.getByTestId("archive-status-counts")).toHaveTextContent("1 indexed");
    expect(screen.getByTestId("archive-status-counts")).toHaveTextContent("1 disputed");
    expect(screen.getByTestId("archive-status-counts")).toHaveTextContent("1 failed");
    expect(within(screen.getByTestId("archive-reference-table")).getAllByRole("row").map((row) => row.textContent)).toEqual([
      "StatusEvidence refSourceReference hashSnapshot IDSnapshot hashReviewVerification",
      "INDEXEDaOFFLINE_REVIEWsha256:asha256:idsha256:snapshotREVIEWABLEVALID",
      "DISPUTED_REFERENCEbOFFLINE_REVIEWsha256:bsha256:idsha256:snapshotREVIEWABLEVALID",
      "FAILED_REFERENCEcOFFLINE_REVIEWsha256:csha256:idsha256:snapshotREVIEWABLEVALID",
    ]);
  });

  it("does not render control paths or mutate input", () => {
    const entries = [entry()];
    const before = JSON.stringify(entries);
    render(React.createElement(AdvisoryEvidenceArchivePanel, { entries }));

    expect(JSON.stringify(entries)).toBe(before);
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
    expect(document.body).not.toHaveTextContent(/Promote to live state|Apply snapshot|Save|Upload|Import evidence|Approve evidence|Override evidence|Deploy evidence/i);
  });
});
