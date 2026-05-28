import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RuntimeContinuityPanel } from "@/components/continuity/RuntimeContinuityPanel";

describe("RuntimeContinuityPanel", () => {
  it("renders runtime continuity state and degraded systems", () => {
    render(
      <RuntimeContinuityPanel
        runtimeState="DEGRADED"
        continuityConfidence={0.61}
        operationalStability="fragile"
        degradedSystems={["database", "workers"]}
        staleLockSummary="2 stale locks"
      />,
    );

    expect(screen.getByText(/degraded/i)).toBeInTheDocument();
    expect(screen.getByText(/database/i)).toBeInTheDocument();
    expect(screen.getByText(/2 stale locks/i)).toBeInTheDocument();
  });
});
