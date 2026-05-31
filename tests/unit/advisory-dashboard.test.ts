import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryDashboard } from "@/components/advisory/AdvisoryDashboard";
import type { AdvisoryReadModel } from "@/services/advisory/advisoryReadModel";

function model(overrides: Partial<AdvisoryReadModel> = {}): AdvisoryReadModel {
  return {
    generatedAt: "2026-05-29T12:00:00.000Z",
    unifiedStatus: "ESCALATE",
    unifiedRisk: "HIGH",
    sourceBreakdown: [
      {
        source: "RELEASE_CERTIFICATION",
        status: "NORMAL",
        risk: "LOW",
        replayable: true,
        evidenceAvailable: true,
        present: true,
      },
      {
        source: "OPERATIONAL_RULES",
        status: "ESCALATE",
        risk: "HIGH",
        replayable: true,
        evidenceAvailable: true,
        present: true,
      },
      {
        source: "DEPLOYMENT_OVERRUN",
        status: "WATCH",
        risk: "MEDIUM",
        replayable: false,
        evidenceAvailable: true,
        present: true,
      },
    ],
    conflicts: [
      {
        source: "DEPLOYMENT_OVERRUN",
        reason: "SOURCE_NOT_REPLAYABLE",
      },
    ],
    evidenceCompleteness: {
      available: 3,
      missing: 0,
    },
    replayability: {
      replayableSources: 2,
      nonReplayableSources: 1,
    },
    snapshotHash: "sha256:snapshot",
    authority: "READ_ONLY",
    mayDeploy: false,
    mayRetry: false,
    mayRollback: false,
    mayCancel: false,
    mayResume: false,
    mayApprove: false,
    mayOverride: false,
    ...overrides,
  };
}

describe("AdvisoryDashboard", () => {
  it("renders read-only advisory state", () => {
    render(React.createElement(AdvisoryDashboard, { model: model() }));

    expect(screen.getByTestId("advisory-dashboard")).toHaveTextContent("Advisory dashboard");
    expect(screen.getByText("READ_ONLY")).toBeVisible();
    expect(screen.getByText("NO_CONTROL_AUTHORITY")).toBeVisible();
    expect(screen.getByTestId("advisory-summary-panel")).toHaveTextContent("ESCALATE");
    expect(screen.getByTestId("advisory-summary-panel")).toHaveTextContent("HIGH");
  });

  it("shows source breakdown conflicts and replayability", () => {
    render(React.createElement(AdvisoryDashboard, { model: model() }));

    expect(screen.getByTestId("source-breakdown-panel")).toHaveTextContent("DEPLOYMENT_OVERRUN");
    expect(screen.getByTestId("conflict-panel")).toHaveTextContent("SOURCE_NOT_REPLAYABLE");
    expect(screen.getByTestId("replayability-panel")).toHaveTextContent("2 replayable");
    expect(screen.getByTestId("evidence-panel")).toHaveTextContent("3 available");
  });

  it("exposes authority leakage as visible conflict without controls", () => {
    render(React.createElement(AdvisoryDashboard, {
      model: model({
        unifiedStatus: "DISPUTED",
        unifiedRisk: "UNKNOWN",
        conflicts: [{ source: "OPERATIONAL_RULES", reason: "AUTHORITY_LEAK:mayDeploy" }],
      }),
    }));

    expect(screen.getByTestId("conflict-panel")).toHaveTextContent("AUTHORITY_LEAK:mayDeploy");
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
  });
});
