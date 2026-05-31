import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryEvidenceRetentionPolicyPanel } from "@/components/advisory/AdvisoryEvidenceRetentionPolicyPanel";
import type { AdvisoryEvidenceRetentionResult } from "@/services/advisory/advisoryEvidenceRetentionPolicy";

function retention(overrides: Partial<AdvisoryEvidenceRetentionResult> = {}): AdvisoryEvidenceRetentionResult {
  return {
    retentionStatus: "RETAIN",
    retentionHash: "sha256:retention",
    referenceHash: "sha256:reference",
    snapshotHash: "sha256:snapshot",
    retentionClass: "STANDARD",
    retentionReason: ["RETENTION_CLASS_STANDARD", "RETENTION_UNTIL:2026-08-29T12:00:00.000Z"],
    source: "OFFLINE_REVIEW",
    policyVersion: "advisory-evidence-retention/v1",
    indexedAt: "2026-05-29T12:00:00.000Z",
    retentionUntil: "2026-08-29T12:00:00.000Z",
    reviewRequired: false,
    evaluatedAt: "2026-05-31T12:00:00.000Z",
    authority: "READ_ONLY",
    trusted: false,
    importedToLiveState: false,
    mayDelete: false,
    mayCompact: false,
    mayArchiveMutate: false,
    mayImportToLiveState: false,
    reasons: [],
    ...overrides,
  };
}

describe("AdvisoryEvidenceRetentionPolicyPanel", () => {
  it("renders RETAIN retention metadata and read-only labels", () => {
    render(React.createElement(AdvisoryEvidenceRetentionPolicyPanel, {
      retentions: [retention()],
    }));

    expect(screen.getByTestId("advisory-retention-policy-panel")).toHaveTextContent("Retention Summary");
    expect(screen.getByText("READ_ONLY")).toBeVisible();
    expect(screen.getByText("RETENTION_METADATA_ONLY")).toBeVisible();
    expect(screen.getByText("NO_LIFECYCLE_ACTIONS")).toBeVisible();
    expect(screen.getByText("NOT_TRUSTED")).toBeVisible();
    expect(screen.getByText("NOT_IMPORTED_TO_LIVE_STATE")).toBeVisible();
    expect(screen.getByText("NO_CONTROL_AUTHORITY")).toBeVisible();
    expect(screen.getByText("Evidence is classified for retention. No lifecycle action is performed.")).toBeVisible();
    expect(screen.getByTestId("retention-metadata")).toHaveTextContent("STANDARD");
    expect(screen.getByTestId("retention-metadata")).toHaveTextContent("2026-08-29T12:00:00.000Z");
    expect(screen.getByTestId("retention-metadata")).toHaveTextContent("review required false");
    expect(screen.getByTestId("retention-metadata")).toHaveTextContent("advisory-evidence-retention/v1");
    expect(screen.getByTestId("retention-metadata")).toHaveTextContent("sha256:retention");
    expect(screen.getByTestId("retention-metadata")).toHaveTextContent("sha256:reference");
    expect(screen.getByTestId("retention-metadata")).toHaveTextContent("sha256:snapshot");
    expect(screen.getByTestId("retention-metadata")).toHaveTextContent("2026-05-29T12:00:00.000Z");
    expect(screen.getByTestId("retention-reasons")).toHaveTextContent("RETENTION_CLASS_STANDARD");
  });

  it("renders REVIEW_RETENTION DISPUTED and FAILED state messages", () => {
    render(React.createElement(AdvisoryEvidenceRetentionPolicyPanel, {
      retentions: [
        retention({
          referenceHash: "sha256:review",
          retentionStatus: "REVIEW_RETENTION",
          reviewRequired: true,
          reasons: ["RETENTION_UNTIL_MISSING"],
        }),
        retention({
          referenceHash: "sha256:disputed",
          retentionStatus: "RETENTION_DISPUTED",
          reviewRequired: true,
          reasons: ["SOURCE_POLICY_VERSION_UNRECOGNIZED"],
        }),
        retention({
          referenceHash: "sha256:failed",
          retentionStatus: "RETENTION_FAILED",
          retentionUntil: null,
          reasons: ["REFERENCE_HASH_MISSING"],
        }),
      ],
    }));

    expect(screen.getByText("Retention metadata requires operator review. No lifecycle action is performed.")).toBeVisible();
    expect(screen.getByText("Retention policy is disputed. Do not treat lifecycle metadata as resolved.")).toBeVisible();
    expect(screen.getByText("Retention classification failed. Required metadata is missing or malformed.")).toBeVisible();
    expect(screen.getByTestId("advisory-retention-policy-panel")).toHaveTextContent("RETENTION_UNTIL_MISSING");
    expect(screen.getByTestId("advisory-retention-policy-panel")).toHaveTextContent("SOURCE_POLICY_VERSION_UNRECOGNIZED");
    expect(screen.getByTestId("advisory-retention-policy-panel")).toHaveTextContent("REFERENCE_HASH_MISSING");
  });

  it("renders unknown retention states safely", () => {
    render(React.createElement(AdvisoryEvidenceRetentionPolicyPanel, {
      retentions: [
        retention({ retentionStatus: "ODD_RETENTION" as AdvisoryEvidenceRetentionResult["retentionStatus"] }),
      ],
    }));

    expect(screen.getByText("UNKNOWN_RETENTION")).toBeVisible();
    expect(screen.getByText("Retention state is unknown. No lifecycle action or trust authority is available.")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
  });

  it("renders empty retention metadata safely", () => {
    render(React.createElement(AdvisoryEvidenceRetentionPolicyPanel, { retentions: [] }));

    expect(screen.getByText("No retention metadata available.")).toBeVisible();
    expect(screen.getByText("READ_ONLY")).toBeVisible();
  });

  it("does not render lifecycle controls or mutate retention input", () => {
    const result = retention();
    const before = JSON.stringify(result);
    render(React.createElement(AdvisoryEvidenceRetentionPolicyPanel, {
      retentions: [result],
    }));

    expect(JSON.stringify(result)).toBe(before);
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
    expect(document.body).not.toHaveTextContent(/Delete evidence|Compact evidence|Import evidence|Trust evidence|Approve evidence|Override evidence|Deploy evidence|Retry evidence|Cancel evidence|Rollback evidence|Resume evidence|Promote to live state|Save retention|Upload retention|Mark retained|Mark trusted|Apply retention/i);
    expect(screen.getByTestId("retention-lifecycle-controls")).toHaveTextContent("mayDelete false");
    expect(screen.getByTestId("retention-lifecycle-controls")).toHaveTextContent("mayCompact false");
    expect(screen.getByTestId("retention-lifecycle-controls")).toHaveTextContent("mayArchiveMutate false");
    expect(screen.getByTestId("retention-lifecycle-controls")).toHaveTextContent("mayImportToLiveState false");
  });
});
