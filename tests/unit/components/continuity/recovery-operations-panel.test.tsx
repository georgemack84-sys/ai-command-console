import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecoveryOperationsPanel } from "@/components/continuity/RecoveryOperationsPanel";

describe("RecoveryOperationsPanel", () => {
  it("renders active, blocked, and quarantined recoveries", () => {
    render(
      <RecoveryOperationsPanel
        activeRecoveries={[{ executionId: "exec-1", status: "running" }]}
        pendingApprovals={[{ executionId: "exec-2", reason: "approval_required" }]}
        blockedRecoveries={[{ executionId: "exec-3", reason: "governance_blocked" }]}
        quarantinedExecutions={[{ executionId: "exec-4", reason: "replay_divergence" }]}
        replayVerificationState="DISPUTED"
        certificationState="REQUIRES_OPERATOR_REVIEW"
      />,
    );

    expect(screen.getByText(/exec-1/i)).toBeInTheDocument();
    expect(screen.getByText(/exec-4/i)).toBeInTheDocument();
  });
});
