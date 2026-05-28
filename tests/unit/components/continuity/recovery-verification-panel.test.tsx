import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecoveryVerificationPanel } from "@/components/continuity/RecoveryVerificationPanel";

describe("RecoveryVerificationPanel", () => {
  it("renders verification state, warnings, and errors", () => {
    render(
      <RecoveryVerificationPanel
        status="DISPUTED"
        verified={false}
        disputed={true}
        divergenceDetected={true}
        evidenceCount={3}
        warnings={["continuity drift"]}
        errors={["RECOVERY_REPLAY_DIVERGENCE_DETECTED"]}
      />,
    );

    expect(screen.getByText(/^DISPUTED$/i)).toBeInTheDocument();
    expect(screen.getByText(/continuity drift/i)).toBeInTheDocument();
  });
});
