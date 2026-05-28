import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContinuityRiskCard } from "@/components/continuity/ContinuityRiskCard";

describe("ContinuityRiskCard", () => {
  it("renders continuity risk score and contributors", () => {
    render(<ContinuityRiskCard continuityRiskScore={72} contributors={["replay divergence", "stale locks"]} />);

    expect(screen.getByText(/72/i)).toBeInTheDocument();
    expect(screen.getByText(/replay divergence/i)).toBeInTheDocument();
  });
});
