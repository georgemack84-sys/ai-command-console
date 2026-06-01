import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryEvidenceLifecycleCertificationReviewPanel } from "@/components/advisory/AdvisoryEvidenceLifecycleCertificationReviewPanel";
import type { AdvisoryEvidenceLifecycleCertification } from "@/services/advisory/advisoryEvidenceLifecycleCertificationGate";

function certification(overrides: Partial<AdvisoryEvidenceLifecycleCertification> = {}): AdvisoryEvidenceLifecycleCertification {
  return {
    certificationStatus: "CERTIFIED",
    certificationHash: "sha256:certification-hash",
    certifiedAt: "2026-05-31T12:00:00.000Z",
    certifiedChain: [
      { phase: "Lifecycle Export Bundle", commit: "bcbaae1", required: true, present: true },
      { phase: "Lifecycle Bundle Verification", commit: "eb9125a", required: true, present: true },
      { phase: "Lifecycle Bundle Review UI", commit: "0749f4d", required: true, present: true },
      { phase: "Lifecycle Bundle Final Seal", commit: "04a52f1", required: true, present: true },
    ],
    checks: {
      deterministic: true,
      readOnly: true,
      replayable: true,
      operatorVisible: true,
      authorityContained: true,
      trustedStateAbsent: true,
      liveImportAbsent: true,
      lifecycleActionsAbsent: true,
      workflowControlAbsent: true,
      buildClean: true,
    },
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

describe("AdvisoryEvidenceLifecycleCertificationReviewPanel", () => {
  it("renders CERTIFIED lifecycle certification state and required labels", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleCertificationReviewPanel, {
      certification: certification(),
    }));

    expect(screen.getByTestId("advisory-lifecycle-certification-review-panel")).toHaveTextContent("CERTIFIED");
    expect(screen.getAllByText("READ_ONLY").length).toBeGreaterThan(0);
    expect(screen.getByText("CERTIFICATION_REVIEW_ONLY")).toBeVisible();
    expect(screen.getByText("NOT_TRUSTED")).toBeVisible();
    expect(screen.getByText("NOT_IMPORTED_TO_LIVE_STATE")).toBeVisible();
    expect(screen.getByText("NO_LIFECYCLE_ACTIONS")).toBeVisible();
    expect(screen.getByText("NO_CONTROL_AUTHORITY")).toBeVisible();
    expect(screen.getByText("Lifecycle certification passed. This does not create authority.")).toBeVisible();
  });

  it("renders conditional disputed failed and unknown states safely", () => {
    const { rerender } = render(React.createElement(AdvisoryEvidenceLifecycleCertificationReviewPanel, {
      certification: certification({ certificationStatus: "CONDITIONAL_CERTIFICATION", reasons: ["OPTIONAL_PHASE_MISSING:Optional"] }),
    }));

    expect(screen.getByText("Lifecycle certification is conditional. Review warnings before relying on lifecycle evidence.")).toBeVisible();
    expect(screen.getByTestId("certification-reasons")).toHaveTextContent("OPTIONAL_PHASE_MISSING:Optional");

    rerender(React.createElement(AdvisoryEvidenceLifecycleCertificationReviewPanel, {
      certification: certification({ certificationStatus: "CERTIFICATION_DISPUTED", reasons: ["TRUSTED_STATE_PRESENT"] }),
    }));
    expect(screen.getByText("Lifecycle certification is disputed. Do not treat lifecycle evidence as certified.")).toBeVisible();

    rerender(React.createElement(AdvisoryEvidenceLifecycleCertificationReviewPanel, {
      certification: certification({ certificationStatus: "CERTIFICATION_FAILED", reasons: ["REQUIRED_PHASE_MISSING:Lifecycle Bundle Verification"] }),
    }));
    expect(screen.getByText("Lifecycle certification failed. Required lifecycle evidence is missing or malformed.")).toBeVisible();

    rerender(React.createElement(AdvisoryEvidenceLifecycleCertificationReviewPanel, {
      certification: certification({ certificationStatus: "ODD_STATUS" as AdvisoryEvidenceLifecycleCertification["certificationStatus"] }),
    }));
    expect(screen.getByText("UNKNOWN_CERTIFICATION")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows certification hash certified chain and checks", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleCertificationReviewPanel, {
      certification: certification(),
    }));

    expect(screen.getByTestId("certification-hash-panel")).toHaveTextContent("sha256:certification-hash");
    expect(screen.getByTestId("certified-chain-panel")).toHaveTextContent("Lifecycle Export Bundle");
    expect(screen.getByTestId("certified-chain-panel")).toHaveTextContent("bcbaae1");
    expect(screen.getByTestId("certified-chain-panel")).toHaveTextContent("Lifecycle Bundle Review UI");
    expect(screen.getByTestId("certification-checks-panel")).toHaveTextContent("Deterministic: true");
    expect(screen.getByTestId("certification-checks-panel")).toHaveTextContent("Read only: true");
    expect(screen.getByTestId("certification-checks-panel")).toHaveTextContent("Replayable: true");
    expect(screen.getByTestId("certification-checks-panel")).toHaveTextContent("Operator visible: true");
    expect(screen.getByTestId("certification-checks-panel")).toHaveTextContent("Authority contained: true");
    expect(screen.getByTestId("certification-checks-panel")).toHaveTextContent("Trusted state absent: true");
    expect(screen.getByTestId("certification-checks-panel")).toHaveTextContent("Live import absent: true");
    expect(screen.getByTestId("certification-checks-panel")).toHaveTextContent("Lifecycle actions absent: true");
    expect(screen.getByTestId("certification-checks-panel")).toHaveTextContent("Workflow control absent: true");
    expect(screen.getByTestId("certification-checks-panel")).toHaveTextContent("Build clean: true");
  });

  it("shows authority containment fields and deterministic reasons", () => {
    const input = certification({ reasons: ["Z_REASON", "A_REASON"] });
    const before = JSON.stringify(input);
    render(React.createElement(AdvisoryEvidenceLifecycleCertificationReviewPanel, { certification: input }));

    expect(JSON.stringify(input)).toBe(before);
    expect(screen.getByTestId("certification-authority-panel")).toHaveTextContent("trusted false");
    expect(screen.getByTestId("certification-authority-panel")).toHaveTextContent("imported to live state false");
    expect(screen.getByTestId("certification-authority-panel")).toHaveTextContent("mayDeploy false");
    expect(screen.getByTestId("certification-authority-panel")).toHaveTextContent("mayRetry false");
    expect(screen.getByTestId("certification-authority-panel")).toHaveTextContent("mayRollback false");
    expect(screen.getByTestId("certification-authority-panel")).toHaveTextContent("mayCancel false");
    expect(screen.getByTestId("certification-authority-panel")).toHaveTextContent("mayResume false");
    expect(screen.getByTestId("certification-authority-panel")).toHaveTextContent("mayApprove false");
    expect(screen.getByTestId("certification-authority-panel")).toHaveTextContent("mayOverride false");
    expect(screen.getByTestId("certification-authority-panel")).toHaveTextContent("mayDelete false");
    expect(screen.getByTestId("certification-authority-panel")).toHaveTextContent("mayCompact false");
    expect(screen.getByTestId("certification-authority-panel")).toHaveTextContent("mayArchiveMutate false");
    expect(screen.getByTestId("certification-authority-panel")).toHaveTextContent("mayImportToLiveState false");
    expect(within(screen.getByTestId("certification-reasons")).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "A_REASON",
      "Z_REASON",
    ]);
  });

  it("does not render forbidden controls or hidden mutation paths", () => {
    render(React.createElement(AdvisoryEvidenceLifecycleCertificationReviewPanel, {
      certification: certification(),
    }));

    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
    expect(document.body).not.toHaveTextContent(/Deploy certification|Retry certification|Cancel certification|Rollback certification|Resume certification|Approve certification|Override certification|Delete certification|Compact certification|Import certification|Trust certification|Promote to live state|Mark certified|Apply certification|Save certification|Upload certification/i);
  });
});
