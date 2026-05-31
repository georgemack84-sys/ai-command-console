import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisorySnapshotReviewPanel } from "@/components/advisory/AdvisorySnapshotReviewPanel";
import type { AdvisorySnapshotOfflineReview } from "@/services/advisory/advisorySnapshotOfflineReview";

function review(overrides: Partial<AdvisorySnapshotOfflineReview> = {}): AdvisorySnapshotOfflineReview {
  return {
    reviewStatus: "REVIEWABLE",
    verificationStatus: "VALID",
    snapshotId: "sha256:id",
    snapshotHash: "sha256:hash",
    hashMatches: true,
    idMatches: true,
    policyVersion: "advisory-snapshot-export/v1",
    unifiedStatus: "NORMAL",
    unifiedRisk: "LOW",
    authorityStatus: "READ_ONLY_CONFIRMED",
    operatorSummary: "Snapshot is reviewable. Hash and identity verified. Advisory authority remains read-only.",
    reviewFindings: [
      { category: "HASH", severity: "INFO", message: "Snapshot hash verified." },
      { category: "IDENTITY", severity: "INFO", message: "Snapshot identity verified." },
      { category: "POLICY", severity: "INFO", message: "Policy version: advisory-snapshot-export/v1." },
      { category: "AUTHORITY", severity: "INFO", message: "Read-only advisory authority confirmed." },
      { category: "PAYLOAD", severity: "INFO", message: "Payload status NORMAL with risk LOW." },
      { category: "REPLAYABILITY", severity: "INFO", message: "Snapshot is replayable from normalized contents." },
    ],
    authority: "READ_ONLY",
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

describe("AdvisorySnapshotReviewPanel", () => {
  it("renders REVIEWABLE offline review state and required labels", () => {
    render(React.createElement(AdvisorySnapshotReviewPanel, { review: review() }));

    expect(screen.getByTestId("advisory-snapshot-review-panel")).toHaveTextContent("REVIEWABLE");
    expect(screen.getByTestId("advisory-snapshot-review-panel")).toHaveTextContent("VALID");
    expect(screen.getByText("READ_ONLY")).toBeVisible();
    expect(screen.getByText("OFFLINE_REVIEW")).toBeVisible();
    expect(screen.getByText("NO_LIVE_STATE_TRUST")).toBeVisible();
    expect(screen.getByText("NO_CONTROL_AUTHORITY")).toBeVisible();
    expect(screen.getByText("Snapshot is reviewable. Hash and identity are verified.")).toBeVisible();
  });

  it("renders DISPUTED_REVIEW and FAILED_REVIEW safely", () => {
    const { rerender } = render(React.createElement(AdvisorySnapshotReviewPanel, {
      review: review({
        reviewStatus: "DISPUTED_REVIEW",
        verificationStatus: "DISPUTED",
        hashMatches: false,
        operatorSummary: "Snapshot is disputed. Hash or identity verification failed. Do not treat this snapshot as trusted evidence.",
        reviewFindings: [{ category: "HASH", severity: "WARNING", message: "Snapshot hash could not be verified." }],
        reasons: ["SNAPSHOT_HASH_MISMATCH"],
      }),
    }));

    expect(screen.getByText("Snapshot is disputed. Do not treat it as trusted advisory evidence.")).toBeVisible();
    expect(screen.getByTestId("snapshot-reasons")).toHaveTextContent("SNAPSHOT_HASH_MISMATCH");

    rerender(React.createElement(AdvisorySnapshotReviewPanel, {
      review: review({
        reviewStatus: "FAILED_REVIEW",
        verificationStatus: "FAILED",
        snapshotId: null,
        snapshotHash: null,
        idMatches: false,
        hashMatches: false,
        policyVersion: null,
        unifiedStatus: null,
        unifiedRisk: null,
        authorityStatus: "UNKNOWN",
        operatorSummary: "Snapshot review failed. Required advisory payload fields are missing.",
        reviewFindings: [{ category: "PAYLOAD", severity: "CRITICAL", message: "Advisory payload fields unavailable." }],
        reasons: ["SNAPSHOT_MISSING"],
      }),
    }));

    expect(screen.getByText("Snapshot review failed. Required payload or verification data is missing.")).toBeVisible();
    expect(screen.getByTestId("snapshot-reasons")).toHaveTextContent("SNAPSHOT_MISSING");
  });

  it("shows integrity policy authority findings and deterministic reasons", () => {
    render(React.createElement(AdvisorySnapshotReviewPanel, {
      review: review({
        reasons: ["B_REASON", "A_REASON"],
      }),
    }));

    expect(screen.getByTestId("snapshot-integrity-panel")).toHaveTextContent("sha256:id");
    expect(screen.getByTestId("snapshot-integrity-panel")).toHaveTextContent("sha256:hash");
    expect(screen.getByTestId("snapshot-integrity-panel")).toHaveTextContent("Hash match: yes");
    expect(screen.getByTestId("snapshot-integrity-panel")).toHaveTextContent("ID match: yes");
    expect(screen.getByTestId("snapshot-integrity-panel")).toHaveTextContent("advisory-snapshot-export/v1");
    expect(screen.getByTestId("snapshot-authority-status")).toHaveTextContent("READ_ONLY_CONFIRMED");
    expect(screen.getByTestId("snapshot-findings-panel")).toHaveTextContent("HASH");
    expect(within(screen.getByTestId("snapshot-reasons")).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "A_REASON",
      "B_REASON",
    ]);
  });

  it("does not render control paths or mutate review input", () => {
    const input = review();
    const before = JSON.stringify(input);
    render(React.createElement(AdvisorySnapshotReviewPanel, { review: input }));

    expect(JSON.stringify(input)).toBe(before);
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
    expect(document.body).not.toHaveTextContent(/Deploy|Retry|Cancel|Rollback|Resume|Approve|Override|Import to live state|Apply snapshot|Mark trusted|Promote to live/i);
  });
});
