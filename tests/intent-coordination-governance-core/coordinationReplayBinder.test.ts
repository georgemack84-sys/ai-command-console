import { describe, expect, it } from "vitest";

import { bindCoordinationReplay } from "@/services/intent-coordination-governance-core/coordinationReplayBinder";
import { inspectCoordinationContainment } from "@/services/intent-coordination-governance-core/coordinationContainmentInspector";
import { validateIntentCoordinationTopology } from "@/services/intent-coordination-governance-core/coordinationTopologyValidator";
import { buildIntentCoordinationGovernanceFixture } from "./helpers";

describe("coordination replay binder", () => {
  it("binds to original readiness, proposal, escalation, and governance evidence", () => {
    const { input } = buildIntentCoordinationGovernanceFixture();
    const topologyResult = validateIntentCoordinationTopology({
      topology: input.topology,
      boundaryContract: input.boundaryContract,
    });
    const containmentResult = inspectCoordinationContainment({
      boundaryContract: input.boundaryContract,
      topologyStats: topologyResult.stats,
      replayValid: true,
      lifecycleValid: true,
      createdAt: input.createdAt,
    });

    const result = bindCoordinationReplay({
      governanceView: input.governanceView,
      readinessGate: input.readinessGate,
      proposal: input.proposal,
      escalation: input.escalation,
      replay: input.replay,
      topology: input.topology,
      containment: containmentResult.containment,
      lifecycleState: "validated",
    });

    expect(result.errors).toEqual([]);
    expect(result.replayBinding.valid).toBe(true);
    expect(result.replayBinding.readinessCertificationHash).toBe(input.readinessGate.readinessHash);
  });
});
