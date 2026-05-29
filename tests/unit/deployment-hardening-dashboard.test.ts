import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeploymentHardeningDashboard } from "@/components/deployment-hardening/DeploymentHardeningDashboard";
import type { DeploymentHardeningReadModel } from "@/services/deployment-hardening/deploymentHardeningReadModel";

function createModel(overrides: Partial<DeploymentHardeningReadModel> = {}): DeploymentHardeningReadModel {
  return {
    workflowId: "deploy",
    deploymentId: "run_100",
    commitSha: "abc123",
    overallState: "PROGRESSING",
    certificateStatus: "VALID",
    checkpointStatus: "SAFE",
    resumeEligibility: "ELIGIBLE",
    deploymentDecision: "ALLOW",
    deploymentRisk: "LOW",
    enforcementMode: "WARN_ONLY",
    enforcementDecision: "ALLOW_CONTINUE",
    enforcementPolicyVersion: "dh-scoped-enforcement/v1",
    enforcementReasons: ["SCOPED_ENFORCEMENT_ALLOW_CONTINUE"],
    deterministicCauses: [],
    blocked: false,
    overrideMode: "OVERRIDE_REQUEST_ONLY",
    overrideDecision: "NO_OVERRIDE",
    overridePolicyVersion: "dh-override-governance/v1",
    operatorId: null,
    approvalReasonPresent: false,
    approvalArtifactHash: null,
    overrideExpiresAt: null,
    overrideReasons: ["SOURCE_NOT_BLOCKED"],
    sourceEnforcementDecision: "ALLOW_CONTINUE",
    sourceBlocked: false,
    currentStep: "release_test",
    currentPartition: "unit-1",
    lastCompletedPartition: "unit-0",
    heartbeatAt: "2026-05-28T12:00:00.000Z",
    staleHeartbeat: false,
    evidenceAvailable: true,
    disputedReasons: [],
    enforcementMode: "READ_ONLY",
    artifacts: [
      {
        name: "certificate-verification.json",
        path: "artifacts/deployment-telemetry/certificate-verification.json",
        available: true,
        malformed: false,
        hash: "sha256:cert",
        reason: null,
      },
      {
        name: "checkpoint-validation.json",
        path: "artifacts/deployment-telemetry/checkpoint-validation.json",
        available: true,
        malformed: false,
        hash: "sha256:checkpoint",
        reason: null,
      },
    ],
    timeline: [
      {
        event: "deploy_start",
        timestamp: "2026-05-28T11:59:00.000Z",
        workflowId: "deploy",
        deploymentId: "run_100",
        commitSha: "abc123",
        state: "RUNNING",
        currentStep: "deploy_start",
        currentPartition: "deploy_start",
        lastCompletedPartition: "none",
        certificateStatus: "UNVERIFIED",
        checkpointStatus: "UNVERIFIED",
        resumeEligibility: "UNVERIFIED",
        deploymentDecision: "DISPUTED",
        deploymentRisk: "UNKNOWN",
        enforcementMode: "WARN_ONLY",
        enforcementDecision: "WARN_CONTINUE",
        enforcementPolicyVersion: "dh-scoped-enforcement/v1",
        enforcementReasons: [],
        deterministicCauses: [],
        blocked: false,
        overrideMode: "OVERRIDE_REQUEST_ONLY",
        overrideDecision: "NO_OVERRIDE",
        overridePolicyVersion: "dh-override-governance/v1",
        operatorId: null,
        overrideExpiresAt: null,
        overrideReasons: [],
        sourceEnforcementDecision: "WARN_CONTINUE",
        sourceBlocked: false,
        failureClass: null,
      },
      {
        event: "deployment_decision_complete",
        timestamp: "2026-05-28T12:00:00.000Z",
        workflowId: "deploy",
        deploymentId: "run_100",
        commitSha: "abc123",
        state: "PROGRESSING",
        currentStep: "deployment_decision",
        currentPartition: "deployment_decision",
        lastCompletedPartition: "checkpoint_validate",
        certificateStatus: "VALID",
        checkpointStatus: "SAFE",
        resumeEligibility: "ELIGIBLE",
        deploymentDecision: "ALLOW",
        deploymentRisk: "LOW",
        enforcementMode: "WARN_ONLY",
        enforcementDecision: "ALLOW_CONTINUE",
        enforcementPolicyVersion: "dh-scoped-enforcement/v1",
        enforcementReasons: ["SCOPED_ENFORCEMENT_ALLOW_CONTINUE"],
        deterministicCauses: [],
        blocked: false,
        overrideMode: "OVERRIDE_REQUEST_ONLY",
        overrideDecision: "NO_OVERRIDE",
        overridePolicyVersion: "dh-override-governance/v1",
        operatorId: null,
        overrideExpiresAt: null,
        overrideReasons: ["SOURCE_NOT_BLOCKED"],
        sourceEnforcementDecision: "ALLOW_CONTINUE",
        sourceBlocked: false,
        failureClass: null,
      },
    ],
    ...overrides,
  };
}

describe("DeploymentHardeningDashboard", () => {
  it("renders valid deployment state", () => {
    render(React.createElement(DeploymentHardeningDashboard, { model: createModel() }));

    expect(screen.getByTestId("deployment-hardening-dashboard")).toHaveTextContent("Operator visibility");
    expect(screen.getByTestId("deployment-status-panel")).toHaveTextContent("PROGRESSING");
    expect(screen.getAllByText("READ_ONLY").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ENFORCEMENT_DISABLED").length).toBeGreaterThan(0);
  });

  it("renders missing certificate evidence without inferring safety", () => {
    render(React.createElement(DeploymentHardeningDashboard, {
      model: createModel({
        overallState: "DISPUTED",
        certificateStatus: "MISSING",
        evidenceAvailable: false,
        disputedReasons: ["EVIDENCE_MISSING:certificate-verification.json"],
      }),
    }));

    expect(screen.getByTestId("certificate-panel")).toHaveTextContent("MISSING");
    expect(screen.getAllByText("Evidence incomplete. Do not infer safety.").length).toBeGreaterThan(0);
  });

  it("renders invalid certificate status", () => {
    render(React.createElement(DeploymentHardeningDashboard, {
      model: createModel({ certificateStatus: "INVALID", overallState: "DISPUTED" }),
    }));

    expect(screen.getByTestId("certificate-panel")).toHaveTextContent("INVALID");
    expect(screen.getByText("Certificate evidence is not sufficient for safety inference.")).toBeVisible();
  });

  it("renders unsafe checkpoint and drift visibility", () => {
    const { rerender } = render(React.createElement(DeploymentHardeningDashboard, {
      model: createModel({ checkpointStatus: "UNSAFE", resumeEligibility: "INELIGIBLE", overallState: "DISPUTED" }),
    }));

    expect(screen.getByTestId("checkpoint-panel")).toHaveTextContent("UNSAFE");
    expect(screen.getByTestId("checkpoint-panel")).toHaveTextContent("INELIGIBLE");

    rerender(React.createElement(DeploymentHardeningDashboard, {
      model: createModel({ checkpointStatus: "DRIFTED", resumeEligibility: "INELIGIBLE", overallState: "DISPUTED" }),
    }));

    expect(screen.getByTestId("checkpoint-panel")).toHaveTextContent("DRIFTED");
    expect(screen.getByTestId("checkpoint-panel")).toHaveTextContent("Detected");
  });

  it("renders block recommendation as recommendation only", () => {
    render(React.createElement(DeploymentHardeningDashboard, {
      model: createModel({ deploymentDecision: "BLOCK_RECOMMENDED", deploymentRisk: "CRITICAL" }),
    }));

    expect(screen.getByTestId("decision-panel")).toHaveTextContent("BLOCK_RECOMMENDED");
    expect(screen.getByText("recommendation only")).toBeVisible();
  });

  it("renders scoped enforcement state", () => {
    render(React.createElement(DeploymentHardeningDashboard, {
      model: createModel({
        enforcementMode: "ENFORCE_SCOPED",
        enforcementDecision: "ENFORCE_BLOCK",
        blocked: true,
        deterministicCauses: ["CERTIFICATE_INVALID"],
        enforcementReasons: ["SCOPED_ENFORCEMENT_BLOCK"],
      }),
    }));

    expect(screen.getByTestId("deployment-status-panel")).toHaveTextContent("ENFORCE_SCOPED");
    expect(screen.getByText("Deployment blocked by scoped enforcement policy.")).toBeVisible();
    expect(screen.getByTestId("decision-panel")).toHaveTextContent("ENFORCE_BLOCK");
    expect(screen.getByText("CERTIFICATE_INVALID")).toBeVisible();
  });

  it("renders disputed scoped enforcement as non-blocking in DH-6", () => {
    render(React.createElement(DeploymentHardeningDashboard, {
      model: createModel({
        enforcementDecision: "DISPUTED_NO_BLOCK",
        enforcementReasons: ["DECISION_ARTIFACT_MISSING"],
      }),
    }));

    expect(screen.getByText("Enforcement state disputed. No block applied in DH-6.")).toBeVisible();
  });

  it("renders override governance state", () => {
    render(React.createElement(DeploymentHardeningDashboard, {
      model: createModel({
        overrideMode: "OVERRIDE_ALLOWED_WITH_ARTIFACT",
        overrideDecision: "OVERRIDE_VALID",
        operatorId: "operator@example.com",
        approvalReasonPresent: true,
        approvalArtifactHash: "sha256:override",
        overrideExpiresAt: "2026-05-28T12:30:00.000Z",
        overrideReasons: ["OVERRIDE_VALIDATED"],
        sourceEnforcementDecision: "ENFORCE_BLOCK",
        sourceBlocked: true,
      }),
    }));

    expect(screen.getByTestId("deployment-status-panel")).toHaveTextContent("OVERRIDE_ALLOWED_WITH_ARTIFACT");
    expect(screen.getByText("Deployment continued under governed override.")).toBeVisible();
    expect(screen.getByText("Override does not erase enforcement evidence.")).toBeVisible();
    expect(screen.getByText("operator@example.com")).toBeVisible();
  });

  it("renders override request and expired warnings", () => {
    const { rerender } = render(React.createElement(DeploymentHardeningDashboard, {
      model: createModel({ overrideDecision: "REQUEST_CREATED", sourceBlocked: true }),
    }));
    expect(screen.getByText("Approval request created. Deployment remains blocked.")).toBeVisible();

    rerender(React.createElement(DeploymentHardeningDashboard, {
      model: createModel({ overrideDecision: "OVERRIDE_EXPIRED", sourceBlocked: true }),
    }));
    expect(screen.getByText("Override expired. Deployment remains blocked.")).toBeVisible();
  });

  it("renders disputed decision as operator review required", () => {
    render(React.createElement(DeploymentHardeningDashboard, {
      model: createModel({ deploymentDecision: "DISPUTED", deploymentRisk: "UNKNOWN", disputedReasons: ["UNKNOWN_STATE"] }),
    }));

    expect(screen.getByTestId("decision-panel")).toHaveTextContent("DISPUTED");
    expect(screen.getByText("operator review required")).toBeVisible();
    expect(screen.getByText("UNKNOWN_STATE")).toBeVisible();
  });

  it("handles missing artifacts", () => {
    render(React.createElement(DeploymentHardeningDashboard, {
      model: createModel({
        evidenceAvailable: false,
        artifacts: [
          {
            name: "deployment-evidence.json",
            path: "artifacts/deployment-telemetry/deployment-evidence.json",
            available: false,
            malformed: false,
            hash: null,
            reason: "missing",
          },
        ],
      }),
    }));

    expect(screen.getByTestId("evidence-panel")).toHaveTextContent("missing");
    expect(screen.getAllByText("Evidence incomplete. Do not infer safety.").length).toBeGreaterThan(0);
  });

  it("handles malformed artifacts", () => {
    render(React.createElement(DeploymentHardeningDashboard, {
      model: createModel({
        evidenceAvailable: false,
        artifacts: [
          {
            name: "deployment-decision.json",
            path: "artifacts/deployment-telemetry/deployment-decision.json",
            available: true,
            malformed: true,
            hash: null,
            reason: "malformed",
          },
        ],
      }),
    }));

    expect(screen.getByTestId("evidence-panel")).toHaveTextContent("malformed");
  });

  it("renders timeline ordering deterministically from the supplied read model", () => {
    render(React.createElement(DeploymentHardeningDashboard, { model: createModel() }));

    const timeline = screen.getByTestId("telemetry-timeline");
    const items = within(timeline).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("deploy_start");
    expect(items[1]).toHaveTextContent("deployment_decision_complete");
  });
});
