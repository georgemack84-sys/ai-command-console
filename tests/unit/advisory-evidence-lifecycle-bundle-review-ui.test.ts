import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryEvidenceLifecycleBundleReviewPanel } from "@/components/advisory/AdvisoryEvidenceLifecycleBundleReviewPanel";
import type { AdvisoryLifecycleBundleVerificationResult } from "@/services/advisory/advisoryEvidenceLifecycleBundleVerification";

function verification(overrides: Partial<AdvisoryLifecycleBundleVerificationResult> = {}): AdvisoryLifecycleBundleVerificationResult {
  return {
    verificationStatus: "VALID_BUNDLE",
    bundleId: "sha256:bundle-id",
    bundleHash: "sha256:bundle-hash",
    expectedBundleHash: "sha256:expected-bundle-hash",
    hashMatches: true,
    policyVersion: "advisory-evidence-lifecycle-export-bundle/v1",
    includedHashesVerified: true,
    authorityVerified: true,
    retentionVerified: true,
    rollupVerified: true,
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

describe("AdvisoryEvidenceLifecycleBundleReviewPanel", () => {
  it("uses verification result as the input contract and renders valid bundle state", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleBundleReviewPanel, {
      verification: verification(),
    }));

    expect(screen.getByTestId("advisory-lifecycle-bundle-review-panel")).toHaveTextContent("VALID_BUNDLE");
    expect(screen.getByText("READ_ONLY")).toBeVisible();
    expect(screen.getByText("VERIFICATION_RESULT_SOURCE")).toBeVisible();
    expect(screen.getByText("NO_EXPORT_ARTIFACT_BYPASS")).toBeVisible();
    expect(screen.getByText("NO_CONTROL_AUTHORITY")).toBeVisible();
    expect(screen.getByText("Bundle verification is valid. Inspection is based only on sealed verification output.")).toBeVisible();
  });

  it("renders disputed and failed verification output safely", () => {
    const { rerender } = render(React.createElement(AdvisoryEvidenceLifecycleBundleReviewPanel, {
      verification: verification({
        verificationStatus: "DISPUTED_BUNDLE",
        hashMatches: false,
        includedHashesVerified: false,
        authorityVerified: false,
        replayable: false,
        reasons: ["BUNDLE_HASH_MISMATCH"],
      }),
    }));

    expect(screen.getByText("Bundle verification is disputed. Do not infer safety from disputed evidence.")).toBeVisible();
    expect(screen.getByTestId("bundle-reasons")).toHaveTextContent("BUNDLE_HASH_MISMATCH");

    rerender(React.createElement(AdvisoryEvidenceLifecycleBundleReviewPanel, {
      verification: verification({
        verificationStatus: "FAILED_BUNDLE",
        bundleId: null,
        bundleHash: null,
        expectedBundleHash: null,
        hashMatches: false,
        policyVersion: null,
        includedHashesVerified: false,
        authorityVerified: false,
        retentionVerified: false,
        rollupVerified: false,
        replayable: false,
        reasons: ["BUNDLE_REQUIRED_FIELDS_MISSING"],
      }),
    }));

    expect(screen.getByText("Bundle verification failed. Required bundle verification evidence is missing or malformed.")).toBeVisible();
    expect(screen.getByTestId("bundle-reasons")).toHaveTextContent("BUNDLE_REQUIRED_FIELDS_MISSING");
  });

  it("renders bundle hash and expected bundle hash separately", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleBundleReviewPanel, {
      verification: verification(),
    }));

    const integrity = screen.getByTestId("bundle-integrity-panel");
    expect(integrity).toHaveTextContent("Bundle hash: sha256:bundle-hash");
    expect(integrity).toHaveTextContent("Expected bundle hash: sha256:expected-bundle-hash");
    expect(integrity).toHaveTextContent("Hash matches: yes");
    expect(integrity).toHaveTextContent("Included hashes verified: yes");
    expect(integrity).toHaveTextContent("Retention verified: yes");
    expect(integrity).toHaveTextContent("Rollup verified: yes");
  });

  it("renders metadata authority and deterministic reasons without controls", () => {
    const input = verification({ reasons: ["Z_REASON", "A_REASON"] });
    const before = JSON.stringify(input);
    render(React.createElement(AdvisoryEvidenceLifecycleBundleReviewPanel, { verification: input }));

    expect(JSON.stringify(input)).toBe(before);
    expect(screen.getByTestId("bundle-identity")).toHaveTextContent("sha256:bundle-id");
    expect(screen.getByTestId("bundle-identity")).toHaveTextContent("advisory-evidence-lifecycle-export-bundle/v1");
    expect(screen.getByTestId("bundle-authority")).toHaveTextContent("trusted false");
    expect(screen.getByTestId("bundle-authority")).toHaveTextContent("imported to live state false");
    expect(screen.getByTestId("bundle-authority")).toHaveTextContent("mayDeploy false");
    expect(screen.getByTestId("bundle-authority")).toHaveTextContent("mayImportToLiveState false");
    expect(within(screen.getByTestId("bundle-reasons")).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "A_REASON",
      "Z_REASON",
    ]);
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
    expect(document.body).not.toHaveTextContent(/Deploy bundle|Retry bundle|Cancel bundle|Rollback bundle|Resume bundle|Approve bundle|Override bundle|Import bundle to live state|Verify bundle now|Export bundle now|Apply bundle|Mark trusted|Delete evidence now|Compact evidence now/i);
  });

  it("does not bypass verification with export artifacts or internal recomputation", () => {
    const root = process.cwd();
    const files = [
      "components/advisory/AdvisoryEvidenceLifecycleBundleReviewPanel.tsx",
      "components/advisory/AdvisoryEvidenceLifecycleBundleIntegrityPanel.tsx",
      "components/advisory/AdvisoryEvidenceLifecycleBundleMetadataPanel.tsx",
    ];
    const source = files.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");

    expect(source).not.toContain("buildAdvisoryEvidenceLifecycleExportBundle");
    expect(source).not.toContain("verifyAdvisoryEvidenceLifecycleBundle");
    expect(source).not.toContain("hashPayloadDeterministically");
    expect(source).toContain("AdvisoryLifecycleBundleVerificationResult");
    expect(fs.existsSync(path.join(root, "app/api/advisory/lifecycle-bundle/review/route.ts"))).toBe(false);
    expect(fs.existsSync(path.join(root, "app/api/advisory/lifecycle-bundle"))).toBe(false);
  });
});
