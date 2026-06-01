import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryGovernanceMetaCertificationReviewPanel } from "@/components/advisory/AdvisoryGovernanceMetaCertificationReviewPanel";
import type { GovernanceMetaCertification } from "@/services/advisory/advisoryGovernanceMetaCertification";

function certification(
  overrides: Partial<GovernanceMetaCertification> = {},
): GovernanceMetaCertification {
  return {
    metaCertificationStatus: "META_CERTIFIED",
    metaCertificationHash: "sha256:meta-certification-hash",
    certifiedAt: "2026-06-01T12:00:00.000Z",
    processChecks: {
      certificationGatePresent: true,
      completionReportPresent: true,
      completionBundleVerificationPresent: true,
      documentationPresent: true,
      adrCoveragePresent: true,
      sealHistoryPresent: true,
      verificationBeforeReviewPreserved: true,
      noLiveImportPreserved: true,
      noTrustedStatePreserved: true,
      authorityContainmentPreserved: true,
    },
    documentedArtifacts: [
      { path: "docs/architecture/overview.md", required: true, present: true },
      { path: "docs/architecture/governance-boundaries.md", required: true, present: true },
      { path: "docs/architecture/seal-history.md", required: true, present: true },
      { path: "docs/adr/ADR-0001-read-only-boundary.md", required: true, present: true },
      { path: "docs/adr/ADR-0002-verification-before-review.md", required: true, present: true },
      { path: "docs/adr/ADR-0003-no-live-import.md", required: true, present: true },
      { path: "docs/adr/ADR-0004-authority-containment.md", required: true, present: true },
    ],
    sealedCommits: [
      { commit: "3674ed5", description: "Completion bundle final seal", required: true, present: true },
      { commit: "5b8ee3e", description: "Lifecycle documentation layer", required: true, present: true },
      { commit: "5047239", description: "Governance meta-certification", required: true, present: true },
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

describe("AdvisoryGovernanceMetaCertificationReviewPanel", () => {
  it("renders certified governance meta-certification state and required labels", () => {
    render(React.createElement(AdvisoryGovernanceMetaCertificationReviewPanel, {
      certification: certification(),
    }));

    expect(screen.getByTestId("advisory-governance-meta-certification-review-panel")).toHaveTextContent("META_CERTIFIED");
    expect(screen.getByTestId("governance-meta-hash-panel")).toHaveTextContent("sha256:meta-certification-hash");
    expect(screen.getByText("2026-06-01T12:00:00.000Z")).toBeVisible();
    expect(screen.getAllByText("READ_ONLY").length).toBeGreaterThan(0);
    expect(screen.getByText("META_CERTIFICATION_REVIEW_ONLY")).toBeVisible();
    expect(screen.getByText("NOT_TRUSTED")).toBeVisible();
    expect(screen.getByText("NOT_IMPORTED_TO_LIVE_STATE")).toBeVisible();
    expect(screen.getByText("NO_LIFECYCLE_ACTIONS")).toBeVisible();
    expect(screen.getByText("NO_CONTROL_AUTHORITY")).toBeVisible();
    expect(screen.getByText("NO_META_AUTHORITY")).toBeVisible();
    expect(screen.getByText("Governance process certification verified.")).toBeVisible();
  });

  it("renders conditional disputed failed and unknown states safely", () => {
    const { rerender } = render(React.createElement(AdvisoryGovernanceMetaCertificationReviewPanel, {
      certification: certification({
        metaCertificationStatus: "META_CONDITIONAL",
        reasons: ["OPTIONAL_DOCUMENT_MISSING:docs/architecture/maintenance-notes.md"],
      }),
    }));

    expect(screen.getByText("Governance certification available with warnings.")).toBeVisible();
    expect(screen.getByTestId("governance-meta-reasons")).toHaveTextContent("OPTIONAL_DOCUMENT_MISSING:docs/architecture/maintenance-notes.md");

    rerender(React.createElement(AdvisoryGovernanceMetaCertificationReviewPanel, {
      certification: certification({
        metaCertificationStatus: "META_DISPUTED",
        trusted: false,
        reasons: ["CONTROL_AUTHORITY_LEAK:metaCertificationEvidence.mayDeploy"],
      }),
    }));

    expect(screen.getByText("Governance certification disputed.")).toBeVisible();
    expect(screen.getByTestId("governance-meta-reasons")).toHaveTextContent("CONTROL_AUTHORITY_LEAK:metaCertificationEvidence.mayDeploy");

    rerender(React.createElement(AdvisoryGovernanceMetaCertificationReviewPanel, {
      certification: certification({
        metaCertificationStatus: "META_FAILED",
        reasons: ["REQUIRED_SEAL_MISSING:560d39f"],
      }),
    }));

    expect(screen.getByText("Governance certification failed.")).toBeVisible();
    expect(screen.getByTestId("governance-meta-reasons")).toHaveTextContent("REQUIRED_SEAL_MISSING:560d39f");

    rerender(React.createElement(AdvisoryGovernanceMetaCertificationReviewPanel, {
      certification: certification({
        metaCertificationStatus: "ODD_STATUS" as GovernanceMetaCertification["metaCertificationStatus"],
      }),
    }));

    expect(screen.getByText("UNKNOWN_META_CERTIFICATION")).toBeVisible();
    expect(screen.getByText("Governance meta-certification state is unknown. Review remains read-only.")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows all process checks without changing them", () => {
    render(React.createElement(AdvisoryGovernanceMetaCertificationReviewPanel, {
      certification: certification(),
    }));

    const processPanel = screen.getByTestId("governance-meta-process-panel");
    expect(processPanel).toHaveTextContent("certification gate present true");
    expect(processPanel).toHaveTextContent("completion report present true");
    expect(processPanel).toHaveTextContent("completion bundle verification present true");
    expect(processPanel).toHaveTextContent("documentation present true");
    expect(processPanel).toHaveTextContent("ADR coverage present true");
    expect(processPanel).toHaveTextContent("seal history present true");
    expect(processPanel).toHaveTextContent("verification before review preserved true");
    expect(processPanel).toHaveTextContent("no live import preserved true");
    expect(processPanel).toHaveTextContent("no trusted state preserved true");
    expect(processPanel).toHaveTextContent("authority containment preserved true");
  });

  it("shows documented ADR coverage and seal coverage", () => {
    render(React.createElement(AdvisoryGovernanceMetaCertificationReviewPanel, {
      certification: certification(),
    }));

    const documents = screen.getByTestId("governance-meta-documents");
    expect(documents).toHaveTextContent("docs/adr/ADR-0001-read-only-boundary.md");
    expect(documents).toHaveTextContent("docs/adr/ADR-0002-verification-before-review.md");
    expect(documents).toHaveTextContent("docs/adr/ADR-0003-no-live-import.md");
    expect(documents).toHaveTextContent("docs/adr/ADR-0004-authority-containment.md");
    expect(documents).toHaveTextContent("required yes present yes");

    const seals = screen.getByTestId("governance-meta-seals");
    expect(seals).toHaveTextContent("3674ed5");
    expect(seals).toHaveTextContent("5b8ee3e");
    expect(seals).toHaveTextContent("5047239");
    expect(seals).toHaveTextContent("required yes present yes");
  });

  it("shows authority fields and deterministic reasons without mutating input", () => {
    const input = certification({ reasons: ["Z_REASON", "A_REASON"] });
    const before = JSON.stringify(input);
    render(React.createElement(AdvisoryGovernanceMetaCertificationReviewPanel, { certification: input }));

    expect(JSON.stringify(input)).toBe(before);
    expect(screen.getByTestId("governance-meta-authority")).toHaveTextContent("authority READ_ONLY");
    expect(screen.getByTestId("governance-meta-authority")).toHaveTextContent("trusted false");
    expect(screen.getByTestId("governance-meta-authority")).toHaveTextContent("imported to live state false");
    expect(screen.getByTestId("governance-meta-authority")).toHaveTextContent("mayDeploy false");
    expect(screen.getByTestId("governance-meta-authority")).toHaveTextContent("mayRetry false");
    expect(screen.getByTestId("governance-meta-authority")).toHaveTextContent("mayRollback false");
    expect(screen.getByTestId("governance-meta-authority")).toHaveTextContent("mayCancel false");
    expect(screen.getByTestId("governance-meta-authority")).toHaveTextContent("mayResume false");
    expect(screen.getByTestId("governance-meta-authority")).toHaveTextContent("mayApprove false");
    expect(screen.getByTestId("governance-meta-authority")).toHaveTextContent("mayOverride false");
    expect(screen.getByTestId("governance-meta-authority")).toHaveTextContent("mayDelete false");
    expect(screen.getByTestId("governance-meta-authority")).toHaveTextContent("mayCompact false");
    expect(screen.getByTestId("governance-meta-authority")).toHaveTextContent("mayArchiveMutate false");
    expect(screen.getByTestId("governance-meta-authority")).toHaveTextContent("mayImportToLiveState false");
    expect(within(screen.getByTestId("governance-meta-reasons")).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "A_REASON",
      "Z_REASON",
    ]);
  });

  it("does not render forbidden controls or mutation paths", () => {
    render(React.createElement(AdvisoryGovernanceMetaCertificationReviewPanel, {
      certification: certification(),
    }));

    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
    expect(document.body).not.toHaveTextContent(/Approve meta-certification|Override meta-certification|Retry meta-certification|Deploy meta-certification|Rollback meta-certification|Resume meta-certification|Import meta-certification|Trust meta-certification|Execute meta-certification|Certify governance now|Promote governance|Apply meta-certification/i);
  });

  it("consumes meta-certification results only and adds no API or action surface", () => {
    const root = process.cwd();
    const files = [
      "components/advisory/AdvisoryGovernanceMetaCertificationReviewPanel.tsx",
      "components/advisory/AdvisoryGovernanceMetaCertificationCoveragePanel.tsx",
      "components/advisory/AdvisoryGovernanceMetaCertificationProcessPanel.tsx",
    ];
    const source = files.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
    const advisoryComponents = fs.readdirSync(path.join(root, "components/advisory"));

    expect(source).toContain("GovernanceMetaCertification");
    expect(source).not.toContain("certifyAdvisoryGovernanceProcess");
    expect(source).not.toContain("hashPayloadDeterministically");
    expect(source).not.toContain("REQUIRED_GOVERNANCE_META_DOCUMENTS");
    expect(source).not.toContain("REQUIRED_GOVERNANCE_META_SEALS");
    expect(advisoryComponents.filter((file) => /GovernanceMetaCertification.*Action/.test(file))).toEqual([]);
    expect(fs.existsSync(path.join(root, "app/api/advisory/governance-meta-certification/route.ts"))).toBe(false);
    expect(fs.existsSync(path.join(root, "app/api/advisory/governance-meta-certification"))).toBe(false);
  });
});
