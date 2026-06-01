import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryGovernanceSustainabilityReviewPanel } from "@/components/advisory/AdvisoryGovernanceSustainabilityReviewPanel";
import type { GovernanceSustainabilityCertification } from "@/services/advisory/advisoryGovernanceSustainabilityCertificationGate";

function certification(
  overrides: Partial<GovernanceSustainabilityCertification> = {},
): GovernanceSustainabilityCertification {
  return {
    sustainabilityStatus: "SUSTAINABILITY_CERTIFIED",
    sustainabilityHash: "sha256:sustainability-hash",
    generatedAt: "2026-06-01T12:00:00.000Z",
    maintenanceCoverage: {
      coverageVisible: true,
      gapsVisible: true,
      lineagePreserved: true,
    },
    sealPreservationCoverage: {
      sealChainCoverage: true,
      sealDependencyVisibility: true,
      sealContinuity: true,
      sealReplayability: true,
    },
    documentationSurvivability: {
      architectureDocumentationCoverage: true,
      operatorHandbookCoverage: true,
      verificationWorkflowCoverage: true,
      sealHistoryPreservation: true,
    },
    adrContinuity: {
      adrLineagePreserved: true,
      appendOnlyPreserved: true,
      supersessionRulesPreserved: true,
      decisionContinuityMaintained: true,
      rationalePreserved: true,
    },
    artifactPreservation: {
      sealedArtifactsRetained: true,
      deprecatedArtifactsMarked: true,
      lineageRetained: true,
      referencesRetained: true,
    },
    driftResistance: {
      governanceDriftExposureVisible: true,
      boundarySurvivability: true,
      authorityExpansionResistance: true,
      knowledgePreservation: true,
    },
    maintenanceReadinessScore: 1,
    preservationReadinessScore: 1,
    sustainabilityTracks: [
      { track: "Maintenance coverage review", optional: true, authoritative: false, runtime: false, present: true },
      { track: "Seal preservation review", optional: true, authoritative: false, runtime: false, present: true },
      { track: "Documentation survivability review", optional: true, authoritative: false, runtime: false, present: true },
      { track: "ADR continuity review", optional: true, authoritative: false, runtime: false, present: true },
      { track: "Artifact preservation review", optional: true, authoritative: false, runtime: false, present: true },
      { track: "Drift resistance review", optional: true, authoritative: false, runtime: false, present: true },
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

describe("AdvisoryGovernanceSustainabilityReviewPanel", () => {
  it("renders certified sustainability state and required labels", () => {
    render(React.createElement(AdvisoryGovernanceSustainabilityReviewPanel, {
      certification: certification(),
    }));

    expect(screen.getByTestId("advisory-governance-sustainability-review-panel")).toHaveTextContent("SUSTAINABILITY_CERTIFIED");
    expect(screen.getByText("Governance sustainability certified. This does not create operational authority.")).toBeVisible();
    expect(screen.getByTestId("sustainability-hash-panel")).toHaveTextContent("sha256:sustainability-hash");
    expect(screen.getByText("2026-06-01T12:00:00.000Z")).toBeVisible();
    expect(screen.getAllByText("READ_ONLY").length).toBeGreaterThan(0);
    expect(screen.getByText("SUSTAINABILITY_REVIEW_ONLY")).toBeVisible();
    expect(screen.getByText("NOT_TRUSTED")).toBeVisible();
    expect(screen.getByText("NOT_IMPORTED_TO_LIVE_STATE")).toBeVisible();
    expect(screen.getByText("NO_LIFECYCLE_ACTIONS")).toBeVisible();
    expect(screen.getByText("NO_CONTROL_AUTHORITY")).toBeVisible();
    expect(screen.getByText("NO_OPERATIONAL_AUTHORITY")).toBeVisible();
  });

  it("renders conditional disputed failed and unknown states safely", () => {
    const { rerender } = render(React.createElement(AdvisoryGovernanceSustainabilityReviewPanel, {
      certification: certification({
        sustainabilityStatus: "SUSTAINABILITY_CONDITIONAL",
        reasons: ["OPTIONAL_SUSTAINABILITY_TRACK_PENDING:ADR continuity review"],
      }),
    }));

    expect(screen.getByText("Governance sustainability is conditional. Review maintenance gaps before relying on long-horizon readiness.")).toBeVisible();
    expect(screen.getByTestId("sustainability-reasons")).toHaveTextContent("OPTIONAL_SUSTAINABILITY_TRACK_PENDING:ADR continuity review");

    rerender(React.createElement(AdvisoryGovernanceSustainabilityReviewPanel, {
      certification: certification({
        sustainabilityStatus: "SUSTAINABILITY_DISPUTED",
        reasons: ["CONTROL_AUTHORITY_LEAK:governanceSustainabilityEvidence.mayDeploy"],
      }),
    }));

    expect(screen.getByText("Governance sustainability is disputed. Do not treat sustainability evidence as resolved.")).toBeVisible();
    expect(screen.getByTestId("sustainability-reasons")).toHaveTextContent("CONTROL_AUTHORITY_LEAK:governanceSustainabilityEvidence.mayDeploy");

    rerender(React.createElement(AdvisoryGovernanceSustainabilityReviewPanel, {
      certification: certification({
        sustainabilityStatus: "SUSTAINABILITY_FAILED",
        reasons: ["REQUIRED_SUSTAINABILITY_DOMAIN_MISSING:adrContinuity.appendOnlyPreserved"],
      }),
    }));

    expect(screen.getByText("Governance sustainability certification failed. Required sustainability evidence is missing or malformed.")).toBeVisible();
    expect(screen.getByTestId("sustainability-reasons")).toHaveTextContent("REQUIRED_SUSTAINABILITY_DOMAIN_MISSING:adrContinuity.appendOnlyPreserved");

    rerender(React.createElement(AdvisoryGovernanceSustainabilityReviewPanel, {
      certification: certification({
        sustainabilityStatus: "ODD_STATUS" as GovernanceSustainabilityCertification["sustainabilityStatus"],
      }),
    }));

    expect(screen.getByText("UNKNOWN_SUSTAINABILITY")).toBeVisible();
    expect(screen.getByText("Governance sustainability state is unknown. Review remains read-only.")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows all sustainability coverage sections", () => {
    render(React.createElement(AdvisoryGovernanceSustainabilityReviewPanel, {
      certification: certification(),
    }));

    expect(screen.getByTestId("sustainability-maintenance-coverage")).toHaveTextContent("coverage visible true");
    expect(screen.getByTestId("sustainability-maintenance-coverage")).toHaveTextContent("gaps visible true");
    expect(screen.getByTestId("sustainability-maintenance-coverage")).toHaveTextContent("lineage preserved true");
    expect(screen.getByTestId("sustainability-seal-preservation")).toHaveTextContent("seal replayability true");
    expect(screen.getByTestId("sustainability-documentation-survivability")).toHaveTextContent("operator handbook coverage true");
    expect(screen.getByTestId("sustainability-adr-continuity")).toHaveTextContent("append only preserved true");
    expect(screen.getByTestId("sustainability-artifact-preservation")).toHaveTextContent("sealed artifacts retained true");
    expect(screen.getByTestId("sustainability-drift-resistance")).toHaveTextContent("authority expansion resistance true");
  });

  it("shows readiness scores and sustainability tracks", () => {
    render(React.createElement(AdvisoryGovernanceSustainabilityReviewPanel, {
      certification: certification(),
    }));

    expect(screen.getByTestId("sustainability-maintenance-score")).toHaveTextContent("maintenance readiness score 1");
    expect(screen.getByTestId("sustainability-preservation-score")).toHaveTextContent("preservation readiness score 1");
    const tracks = screen.getByTestId("sustainability-tracks");
    expect(tracks).toHaveTextContent("Maintenance coverage review");
    expect(tracks).toHaveTextContent("Seal preservation review");
    expect(tracks).toHaveTextContent("Documentation survivability review");
    expect(tracks).toHaveTextContent("ADR continuity review");
    expect(tracks).toHaveTextContent("Artifact preservation review");
    expect(tracks).toHaveTextContent("Drift resistance review");
    expect(tracks).toHaveTextContent("optional true authoritative false runtime false present true");
  });

  it("shows authority fields and deterministic reasons without mutating input", () => {
    const input = certification({ reasons: ["Z_REASON", "A_REASON"] });
    const before = JSON.stringify(input);
    render(React.createElement(AdvisoryGovernanceSustainabilityReviewPanel, { certification: input }));

    expect(JSON.stringify(input)).toBe(before);
    expect(screen.getByTestId("sustainability-authority")).toHaveTextContent("authority READ_ONLY");
    expect(screen.getByTestId("sustainability-authority")).toHaveTextContent("trusted false");
    expect(screen.getByTestId("sustainability-authority")).toHaveTextContent("imported to live state false");
    expect(screen.getByTestId("sustainability-authority")).toHaveTextContent("mayDeploy false");
    expect(screen.getByTestId("sustainability-authority")).toHaveTextContent("mayRetry false");
    expect(screen.getByTestId("sustainability-authority")).toHaveTextContent("mayRollback false");
    expect(screen.getByTestId("sustainability-authority")).toHaveTextContent("mayCancel false");
    expect(screen.getByTestId("sustainability-authority")).toHaveTextContent("mayResume false");
    expect(screen.getByTestId("sustainability-authority")).toHaveTextContent("mayApprove false");
    expect(screen.getByTestId("sustainability-authority")).toHaveTextContent("mayOverride false");
    expect(screen.getByTestId("sustainability-authority")).toHaveTextContent("mayDelete false");
    expect(screen.getByTestId("sustainability-authority")).toHaveTextContent("mayCompact false");
    expect(screen.getByTestId("sustainability-authority")).toHaveTextContent("mayArchiveMutate false");
    expect(screen.getByTestId("sustainability-authority")).toHaveTextContent("mayImportToLiveState false");
    expect(within(screen.getByTestId("sustainability-reasons")).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "A_REASON",
      "Z_REASON",
    ]);
  });

  it("does not render forbidden controls or mutation paths", () => {
    render(React.createElement(AdvisoryGovernanceSustainabilityReviewPanel, {
      certification: certification(),
    }));

    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
    expect(document.body).not.toHaveTextContent(/Deploy sustainability|Retry sustainability|Cancel sustainability|Rollback sustainability|Resume sustainability|Approve sustainability|Override sustainability|Delete sustainability|Compact sustainability|Import sustainability|Trust sustainability|Schedule Audit|Run Audit|Start Maintenance|Apply Sustainability|Promote to live state|Save sustainability|Upload sustainability/i);
  });

  it("consumes sustainability certification results only and adds no API or action surface", () => {
    const root = process.cwd();
    const files = [
      "components/advisory/AdvisoryGovernanceSustainabilityReviewPanel.tsx",
      "components/advisory/AdvisoryGovernanceSustainabilityCoveragePanel.tsx",
      "components/advisory/AdvisoryGovernanceSustainabilityScoresPanel.tsx",
    ];
    const source = files.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
    const advisoryComponents = fs.readdirSync(path.join(root, "components/advisory"));

    expect(source).toContain("GovernanceSustainabilityCertification");
    expect(source).not.toContain("certifyGovernanceSustainability");
    expect(source).not.toContain("hashPayloadDeterministically");
    expect(source).not.toContain("RECOMMENDED_GOVERNANCE_SUSTAINABILITY_TRACKS");
    expect(source).not.toContain("fs.");
    expect(source).not.toContain("docs/adr");
    expect(source).not.toContain("docs/architecture");
    expect(advisoryComponents.filter((file) => /SustainabilityAction/.test(file))).toEqual([]);
    expect(fs.existsSync(path.join(root, "app/api/advisory/governance-sustainability/route.ts"))).toBe(false);
    expect(fs.existsSync(path.join(root, "app/api/advisory/governance-sustainability"))).toBe(false);
  });
});
