import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperationalGovernanceIntegrationPanel } from "@/components/advisory/OperationalGovernanceIntegrationPanel";
import type { OperationalGovernanceIntegration } from "@/services/advisory/advisoryOperationalGovernanceIntegration";

function integration(overrides: Partial<OperationalGovernanceIntegration> = {}): OperationalGovernanceIntegration {
  return {
    integrationStatus: "INTEGRATED",
    integrationHash: "sha256:integration-hash",
    governanceStates: [
      { source: "Meta-Certification", status: "META_CERTIFIED", hash: "sha256:meta", present: true, required: true },
      { source: "Program Completion", status: "PROGRAM_COMPLETE", hash: "sha256:program", present: true, required: true },
    ],
    certificationStates: [
      { source: "Sustainability Certification", status: "SUSTAINABILITY_CERTIFIED", hash: "sha256:sustainability", present: true, required: true },
    ],
    sustainabilityStates: [
      { source: "Sustainability Review UI", status: "SEALED", hash: "1558b74", present: true, required: true },
    ],
    maintenanceStates: [
      { source: "Maintenance Framework", status: "MAINTENANCE_READY", hash: "sha256:maintenance", present: true, required: true },
    ],
    replayReadiness: {
      replayable: true,
      sealLineageVisible: true,
      verificationLineageVisible: true,
      certificationLineageVisible: true,
      artifactContinuityVisible: true,
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

describe("OperationalGovernanceIntegrationPanel", () => {
  it("renders integrated governance visibility and required labels", () => {
    render(React.createElement(OperationalGovernanceIntegrationPanel, {
      integration: integration(),
    }));

    expect(screen.getByTestId("operational-governance-integration-panel")).toHaveTextContent("INTEGRATED");
    expect(screen.getByText("Governance is operationally visible without operational authority.")).toBeVisible();
    expect(screen.getByTestId("operational-governance-hash-panel")).toHaveTextContent("sha256:integration-hash");
    expect(screen.getAllByText("READ_ONLY").length).toBeGreaterThan(0);
    expect(screen.getByText("OPERATIONAL_VISIBILITY_ONLY")).toBeVisible();
    expect(screen.getByText("NOT_TRUSTED")).toBeVisible();
    expect(screen.getByText("NOT_IMPORTED_TO_LIVE_STATE")).toBeVisible();
    expect(screen.getByText("NO_EXECUTION_AUTHORITY")).toBeVisible();
    expect(screen.getByText("NO_CONTROL_AUTHORITY")).toBeVisible();
    expect(screen.getByText("OPERATOR_SUPREMACY_PRESERVED")).toBeVisible();
  });

  it("renders partial disputed failed and unknown states safely", () => {
    const { rerender } = render(React.createElement(OperationalGovernanceIntegrationPanel, {
      integration: integration({
        integrationStatus: "PARTIALLY_INTEGRATED",
        reasons: ["REPLAY_VISIBILITY_GAP:verificationLineageVisible"],
      }),
    }));

    expect(screen.getByText("Governance visibility is partial. Review missing optional state or replay gaps.")).toBeVisible();
    expect(screen.getByTestId("operational-governance-reasons")).toHaveTextContent("REPLAY_VISIBILITY_GAP:verificationLineageVisible");

    rerender(React.createElement(OperationalGovernanceIntegrationPanel, {
      integration: integration({
        integrationStatus: "DISPUTED_INTEGRATION",
        reasons: ["CONTROL_AUTHORITY_LEAK:operationalGovernanceEvidence.mayDeploy"],
      }),
    }));

    expect(screen.getByText("Operational governance integration is disputed. Authority boundaries require review.")).toBeVisible();

    rerender(React.createElement(OperationalGovernanceIntegrationPanel, {
      integration: integration({
        integrationStatus: "FAILED_INTEGRATION",
        reasons: ["REQUIRED_GOVERNANCE_STATE_MISSING:Meta-Certification"],
      }),
    }));

    expect(screen.getByText("Operational governance integration failed. Required governance state is missing.")).toBeVisible();

    rerender(React.createElement(OperationalGovernanceIntegrationPanel, {
      integration: integration({
        integrationStatus: "ODD_STATUS" as OperationalGovernanceIntegration["integrationStatus"],
      }),
    }));

    expect(screen.getByText("UNKNOWN_INTEGRATION")).toBeVisible();
    expect(screen.getByText("Operational governance integration state is unknown. Review remains read-only.")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows governance certification sustainability maintenance and replay states", () => {
    render(React.createElement(OperationalGovernanceIntegrationPanel, {
      integration: integration(),
    }));

    expect(screen.getByTestId("operational-governance-states")).toHaveTextContent("Meta-Certification");
    expect(screen.getByTestId("operational-governance-states")).toHaveTextContent("PROGRAM_COMPLETE");
    expect(screen.getByTestId("operational-certification-states")).toHaveTextContent("Sustainability Certification");
    expect(screen.getByTestId("operational-sustainability-states")).toHaveTextContent("Sustainability Review UI");
    expect(screen.getByTestId("operational-maintenance-states")).toHaveTextContent("Maintenance Framework");
    expect(screen.getByTestId("operational-governance-replay-panel")).toHaveTextContent("replayable true");
    expect(screen.getByTestId("operational-governance-replay-panel")).toHaveTextContent("seal lineage visible true");
    expect(screen.getByTestId("operational-governance-replay-panel")).toHaveTextContent("verification lineage visible true");
    expect(screen.getByTestId("operational-governance-replay-panel")).toHaveTextContent("certification lineage visible true");
    expect(screen.getByTestId("operational-governance-replay-panel")).toHaveTextContent("artifact continuity visible true");
  });

  it("shows authority fields and deterministic reasons without mutating input", () => {
    const input = integration({ reasons: ["Z_REASON", "A_REASON"] });
    const before = JSON.stringify(input);
    render(React.createElement(OperationalGovernanceIntegrationPanel, { integration: input }));

    expect(JSON.stringify(input)).toBe(before);
    expect(screen.getByTestId("operational-governance-authority")).toHaveTextContent("authority READ_ONLY");
    expect(screen.getByTestId("operational-governance-authority")).toHaveTextContent("trusted false");
    expect(screen.getByTestId("operational-governance-authority")).toHaveTextContent("imported to live state false");
    expect(screen.getByTestId("operational-governance-authority")).toHaveTextContent("mayDeploy false");
    expect(screen.getByTestId("operational-governance-authority")).toHaveTextContent("mayRetry false");
    expect(screen.getByTestId("operational-governance-authority")).toHaveTextContent("mayRollback false");
    expect(screen.getByTestId("operational-governance-authority")).toHaveTextContent("mayCancel false");
    expect(screen.getByTestId("operational-governance-authority")).toHaveTextContent("mayResume false");
    expect(screen.getByTestId("operational-governance-authority")).toHaveTextContent("mayApprove false");
    expect(screen.getByTestId("operational-governance-authority")).toHaveTextContent("mayOverride false");
    expect(screen.getByTestId("operational-governance-authority")).toHaveTextContent("mayDelete false");
    expect(screen.getByTestId("operational-governance-authority")).toHaveTextContent("mayCompact false");
    expect(screen.getByTestId("operational-governance-authority")).toHaveTextContent("mayArchiveMutate false");
    expect(screen.getByTestId("operational-governance-authority")).toHaveTextContent("mayImportToLiveState false");
    expect(within(screen.getByTestId("operational-governance-reasons")).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "A_REASON",
      "Z_REASON",
    ]);
  });

  it("does not render forbidden controls or mutation paths", () => {
    render(React.createElement(OperationalGovernanceIntegrationPanel, {
      integration: integration(),
    }));

    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
    expect(document.body).not.toHaveTextContent(/Deploy governance|Retry governance|Cancel governance|Rollback governance|Resume governance|Approve governance|Override governance|Delete governance|Compact governance|Import governance|Trust governance|Schedule governance|Run governance|Start governance|Apply governance|Promote governance|Save governance|Upload governance/i);
  });

  it("does not add route actions or call integration service from UI", () => {
    const root = process.cwd();
    const files = [
      "components/advisory/OperationalGovernanceIntegrationPanel.tsx",
      "components/advisory/OperationalGovernanceStatePanel.tsx",
      "components/advisory/OperationalGovernanceReplayPanel.tsx",
    ];
    const source = files.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
    const advisoryComponents = fs.readdirSync(path.join(root, "components/advisory"));

    expect(source).toContain("OperationalGovernanceIntegration");
    expect(source).not.toContain("integrateOperationalGovernanceVisibility");
    expect(source).not.toContain("hashPayloadDeterministically");
    expect(source).not.toContain("fs.");
    expect(advisoryComponents.filter((file) => /OperationalAction/.test(file))).toEqual([]);
    expect(fs.existsSync(path.join(root, "app/api/operational-governance"))).toBe(false);
  });
});
