import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  createDefaultCollaborationGovernance,
  normalizeCollaborationState,
  sanitizeCollaborationState,
} = require("../../services/collaborationState.js");

describe("collaboration state helpers", () => {
  it("normalizes malformed collaboration payloads while preserving governance policy merges", () => {
    const normalized = normalizeCollaborationState({
      sharedSessions: "bad",
      handoffs: null,
      approvals: {},
      governance: {
        currentEnvironment: "production",
        environmentPolicies: {
          production: {
            minimumRoleForCommands: "admin",
          },
        },
        workspacePolicyOverrides: "bad",
      },
      inboxState: [],
      digestRuns: "bad",
    });

    expect(normalized.sharedSessions).toEqual([]);
    expect(normalized.handoffs).toEqual([]);
    expect(normalized.approvals).toEqual([]);
    expect(normalized.inboxState).toEqual({});
    expect(normalized.digestRuns).toEqual({});
    expect(normalized.governance.currentEnvironment).toBe("production");
    expect(normalized.governance.workspacePolicyOverrides).toEqual({});
    expect(normalized.governance.environmentPolicies.production).toEqual(
      expect.objectContaining({
        minimumRoleForCommands: "admin",
        minimumRoleForApprovals: "approver",
      }),
    );
  });

  it("sanitizes collaboration arrays to bounded history windows", () => {
    const defaultGovernance = createDefaultCollaborationGovernance();
    const makeEntries = (count: number, prefix: string) =>
      Array.from({ length: count }, (_, index) => `${prefix}-${index + 1}`);

    const sanitized = sanitizeCollaborationState({
      governance: {
        ...defaultGovernance,
        appliedApprovalPolicies: makeEntries(75, "policy"),
        approvalRecommendationObservations: makeEntries(130, "observation"),
        approvalTrustAlertAcks: makeEntries(130, "ack"),
        approvalTrustHistory: makeEntries(650, "history"),
        workspacePolicyPlaybooks: makeEntries(35, "playbook"),
        workspacePolicyPlaybookRollouts: makeEntries(140, "rollout"),
        defaultPolicyPlaybookPresets: makeEntries(30, "preset"),
      },
      sharedSessions: makeEntries(140, "session"),
      handoffs: makeEntries(130, "handoff"),
      approvals: makeEntries(135, "approval"),
    });

    expect(sanitized.governance.appliedApprovalPolicies).toHaveLength(50);
    expect(sanitized.governance.appliedApprovalPolicies[0]).toBe("policy-26");
    expect(sanitized.governance.approvalRecommendationObservations).toHaveLength(100);
    expect(sanitized.governance.approvalTrustAlertAcks).toHaveLength(100);
    expect(sanitized.governance.approvalTrustHistory).toHaveLength(500);
    expect(sanitized.governance.workspacePolicyPlaybooks).toHaveLength(20);
    expect(sanitized.governance.workspacePolicyPlaybookRollouts).toHaveLength(100);
    expect(sanitized.governance.defaultPolicyPlaybookPresets).toHaveLength(20);
    expect(sanitized.sharedSessions).toHaveLength(100);
    expect(sanitized.handoffs).toHaveLength(100);
    expect(sanitized.approvals).toHaveLength(100);
  });
});
