import { describe, expect, it } from "vitest";
import { NuruModelRouter } from "@/src/server/services/nuru-model-router";

describe("Nuru model router", () => {
  it("routes each role by reasoning need while preserving local-only privacy", () => {
    expect(NuruModelRouter.route({ agentType: "DISCOVERY", complexity: "LOW", costSensitivity: "HIGH" })).toMatchObject({ tier: "FAST" });
    expect(NuruModelRouter.route({ agentType: "CONNECTION" })).toMatchObject({ tier: "REASONING" });
    expect(NuruModelRouter.route({ agentType: "QUALITY" })).toMatchObject({ tier: "STRONGEST" });
    expect(NuruModelRouter.route({ agentType: "CURATOR", privacy: "LOCAL_ONLY" })).toMatchObject({ tier: "LOCAL", privacyPreserving: true });
  });
});
