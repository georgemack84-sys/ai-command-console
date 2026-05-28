import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TruthReconciliationPanel } from "@/components/continuity/TruthReconciliationPanel";

describe("TruthReconciliationPanel", () => {
  it("renders reconciliation state and mismatches", () => {
    render(
      <TruthReconciliationPanel
        reconciliationState="PARTIALLY_RECONCILED"
        mismatches={["checkpoint mismatch"]}
        runtimeConsistent={true}
        governanceConsistent={true}
        simulationConsistent={false}
        immutableEvidenceValid={true}
      />,
    );

    expect(screen.getByText(/partially_reconciled/i)).toBeInTheDocument();
    expect(screen.getByText(/checkpoint mismatch/i)).toBeInTheDocument();
  });
});
