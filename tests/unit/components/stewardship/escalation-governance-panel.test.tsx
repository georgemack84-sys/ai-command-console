import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EscalationGovernancePanel } from "@/components/stewardship/EscalationGovernancePanel";

describe("EscalationGovernancePanel", () => {
  it("renders escalation lineage and frozen state", () => {
    render(
      <EscalationGovernancePanel
        escalationGovernance={{
          escalationLineage: ["lineage_1"],
          emergencyEscalations: ["esc_1"],
          governanceEscalations: ["esc_2"],
          constitutionalDisputes: ["audit_integrity_disputed"],
          containmentStatus: "CONTAINMENT_REQUIRED",
        }}
        frozen={true}
      />,
    );

    expect(screen.getByText(/lineage_1/i)).toBeInTheDocument();
    expect(screen.getByText(/frozen: yes/i)).toBeInTheDocument();
  });
});
