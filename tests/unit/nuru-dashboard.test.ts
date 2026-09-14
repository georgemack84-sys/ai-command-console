import { describe, expect, it } from "vitest";
import {
  applyNuruAction,
  discoveries,
  emptyPreferences,
  getNuruDiscoveryDetail,
  nuruActionSchema,
  parseNuruGuestState,
} from "@/src/nuru/dashboard";
import { nuruEditionSchema } from "@/src/server/services/nuru-edition-service";

describe("Nuru preference actions", () => {
  it("moves a discovery between saved and dismissed states", () => {
    const saved = applyNuruAction(emptyPreferences, { type: "save-discovery", discoveryId: "apollo-guidance-computer" });
    const dismissed = applyNuruAction(saved, { type: "dismiss-discovery", discoveryId: "apollo-guidance-computer" });

    expect(saved.savedDiscoveryIds).toEqual(["apollo-guidance-computer"]);
    expect(dismissed.savedDiscoveryIds).toEqual([]);
    expect(dismissed.dismissedDiscoveryIds).toEqual(["apollo-guidance-computer"]);
  });

  it("toggles a repeated preference action and preserves unrelated signals", () => {
    const withAffinity = applyNuruAction(emptyPreferences, { type: "set-affinity", discoveryId: "semiconductor-wars", value: "more" });
    const saved = applyNuruAction(withAffinity, { type: "save-discovery", discoveryId: "semiconductor-wars" });
    const unsaved = applyNuruAction(saved, { type: "save-discovery", discoveryId: "semiconductor-wars" });

    expect(unsaved.savedDiscoveryIds).toEqual([]);
    expect(unsaved.affinities).toEqual({ "semiconductor-wars": "more" });
  });

  it("rejects malformed actions and safely resets malformed guest state", () => {
    expect(nuruActionSchema.safeParse({ type: "save-discovery" }).success).toBe(false);
    expect(parseNuruGuestState("not-json")).toEqual({ ...emptyPreferences, rabbitHoleProgress: {}, tasteMapFeedback: {} });
  });
});

describe("Nuru edition contracts", () => {
  const discoveryIds = ["one", "two", "three", "four", "five", "six", "seven"];

  it("requires seven distinct discoveries and a featured selection from that set", () => {
    expect(nuruEditionSchema.safeParse({ discoveryIds, featuredId: "one" }).success).toBe(true);
    expect(nuruEditionSchema.safeParse({ discoveryIds: ["one", "one", "two", "three", "four", "five", "six"], featuredId: "one" }).success).toBe(false);
    expect(nuruEditionSchema.safeParse({ discoveryIds, featuredId: "outside-the-edition" }).success).toBe(false);
  });

  it("keeps the public discovery detail catalogue addressable", () => {
    expect(discoveries).toHaveLength(7);
    expect(getNuruDiscoveryDetail("billion-dollar-spy")?.title).toBe("The Billion Dollar Spy");
    expect(getNuruDiscoveryDetail("mapping-the-ocean-floor")?.paths).toContain("Measurement");
    expect(getNuruDiscoveryDetail("missing-discovery")).toBeNull();
  });
});
