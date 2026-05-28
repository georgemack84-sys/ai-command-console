import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceVisibilityPanel } from "@/components/continuity/GovernanceVisibilityPanel";

describe("GovernanceVisibilityPanel", () => {
  it("renders governance disputes and block reasons", () => {
    render(
      <GovernanceVisibilityPanel
        deniedRecoveryAttempts={[{ executionId: "exec-1", reason: "policy_denied" }]}
        approvalRequirements={[{ executionId: "exec-2", reason: "approval_required" }]}
        auditEvidence={[{ id: "audit-1", type: "recovery.governance.blocked" }]}
        recoveryDisputes={["RECOVERY_GOVERNANCE_BLOCKED"]}
        escalationEvents={[{ id: "audit-2", type: "recovery.escalated" }]}
      />,
    );

    expect(screen.getByText(/Denied attempts: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/RECOVERY_GOVERNANCE_BLOCKED/i)).toBeInTheDocument();
  });
});
