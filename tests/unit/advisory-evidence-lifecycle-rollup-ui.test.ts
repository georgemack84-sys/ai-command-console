import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AdvisoryEvidenceLifecycleRollupPanel,
  type AdvisoryEvidenceLifecycleRollup,
} from "@/components/advisory/AdvisoryEvidenceLifecycleRollupPanel";

function rollup(overrides: Partial<AdvisoryEvidenceLifecycleRollup> = {}): AdvisoryEvidenceLifecycleRollup {
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
      "advisory-snapshot-export/v1",
      "advisory-evidence-retention/v1",
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
    reasons: [],
    ...overrides,
  };
}

describe("AdvisoryEvidenceLifecycleRollupPanel", () => {
  it("renders available lifecycle rollup with all stage statuses and labels", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleRollupPanel, {
      rollup: rollup(),
    }));

    expect(screen.getByTestId("advisory-lifecycle-rollup-panel")).toHaveTextContent("Lifecycle Summary");
    expect(screen.getByText("READ_ONLY")).toBeVisible();
    expect(screen.getByText("LIFECYCLE_ROLLUP_ONLY")).toBeVisible();
    expect(screen.getByText("NOT_TRUSTED")).toBeVisible();
    expect(screen.getByText("NOT_IMPORTED_TO_LIVE_STATE")).toBeVisible();
    expect(screen.getByText("NO_LIFECYCLE_ACTIONS")).toBeVisible();
    expect(screen.getByText("NO_CONTROL_AUTHORITY")).toBeVisible();
    expect(screen.getByText("Advisory evidence lifecycle is available for inspection. No lifecycle action is performed.")).toBeVisible();
    expect(screen.getByTestId("lifecycle-stage-statuses")).toHaveTextContent("EXPORTED");
    expect(screen.getByTestId("lifecycle-stage-statuses")).toHaveTextContent("VALID");
    expect(screen.getByTestId("lifecycle-stage-statuses")).toHaveTextContent("REVIEWABLE");
    expect(screen.getByTestId("lifecycle-stage-statuses")).toHaveTextContent("INDEXED");
    expect(screen.getByTestId("lifecycle-stage-statuses")).toHaveTextContent("SUMMARIZED");
    expect(screen.getByTestId("lifecycle-stage-statuses")).toHaveTextContent("RETAIN");
  });

  it("renders disputed and failed lifecycle states", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleRollupPanel, {
      rollup: rollup({
        lifecycleStatus: "LIFECYCLE_DISPUTED",
        exportStatus: "DISPUTED_EXPORT",
        verificationStatus: "DISPUTED",
        reviewStatus: "DISPUTED_REVIEW",
        archiveStatus: "DISPUTED_REFERENCE",
        summaryStatus: "DISPUTED_SUMMARY",
        retentionStatus: "RETENTION_DISPUTED",
        reviewRequired: true,
        reasons: ["LIFECYCLE_DISPUTED"],
      }),
    }));

    expect(screen.getByText("Advisory evidence lifecycle is disputed. Review disputed stages before relying on evidence.")).toBeVisible();
    expect(screen.getByTestId("lifecycle-reasons")).toHaveTextContent("LIFECYCLE_DISPUTED");

    render(React.createElement(AdvisoryEvidenceLifecycleRollupPanel, {
      rollup: rollup({
        lifecycleStatus: "LIFECYCLE_FAILED",
        exportStatus: "FAILED_EXPORT",
        verificationStatus: "FAILED",
        reviewStatus: "FAILED_REVIEW",
        archiveStatus: "FAILED_REFERENCE",
        summaryStatus: "FAILED_SUMMARY",
        retentionStatus: "RETENTION_FAILED",
        reasons: ["LIFECYCLE_FAILED"],
      }),
    }));

    expect(screen.getByText("Advisory evidence lifecycle failed. Required lifecycle metadata is missing or malformed.")).toBeVisible();
    expect(screen.getAllByText("FAILED_EXPORT").length).toBeGreaterThan(0);
  });

  it("renders unknown lifecycle state safely", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleRollupPanel, {
      rollup: rollup({ lifecycleStatus: "ODD_LIFECYCLE" as AdvisoryEvidenceLifecycleRollup["lifecycleStatus"] }),
    }));

    expect(screen.getByText("LIFECYCLE_UNKNOWN")).toBeVisible();
    expect(screen.getByText("Advisory evidence lifecycle state is unknown. No trust or lifecycle authority is available.")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
  });

  it("shows hashes policy versions retention state and authority state", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleRollupPanel, {
      rollup: rollup(),
    }));

    expect(screen.getByTestId("lifecycle-snapshot-integrity")).toHaveTextContent("sha256:snapshot-id");
    expect(screen.getByTestId("lifecycle-snapshot-integrity")).toHaveTextContent("sha256:snapshot");
    expect(screen.getByTestId("lifecycle-summary-state")).toHaveTextContent("sha256:summary");
    expect(screen.getByTestId("lifecycle-retention-state")).toHaveTextContent("sha256:retention");
    expect(screen.getByTestId("lifecycle-retention-state")).toHaveTextContent("review required false");
    expect(screen.getByTestId("lifecycle-policy-versions")).toHaveTextContent("advisory-snapshot-export/v1");
    expect(screen.getByTestId("lifecycle-policy-versions")).toHaveTextContent("advisory-evidence-retention/v1");
    expect(screen.getByTestId("lifecycle-authority-state")).toHaveTextContent("trusted false");
    expect(screen.getByTestId("lifecycle-authority-state")).toHaveTextContent("imported to live state false");
    expect(screen.getByTestId("lifecycle-authority-state")).toHaveTextContent("mayDelete false");
    expect(screen.getByTestId("lifecycle-authority-state")).toHaveTextContent("mayCompact false");
  });

  it("does not render controls or mutate lifecycle input", () => {
    const value = rollup();
    const before = JSON.stringify(value);
    render(React.createElement(AdvisoryEvidenceLifecycleRollupPanel, { rollup: value }));

    expect(JSON.stringify(value)).toBe(before);
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
    expect(document.body).not.toHaveTextContent(/Trust evidence|Import evidence|Approve evidence|Override evidence|Deploy evidence|Retry evidence|Cancel evidence|Rollback evidence|Resume evidence|Delete evidence|Compact evidence|Promote to live state|Save lifecycle|Upload lifecycle|Apply lifecycle|Mark trusted|Mark retained/i);
  });
});
