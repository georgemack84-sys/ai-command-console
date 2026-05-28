import { describe, expect, it } from "vitest";

import {
  buildImmutableReplayBinding,
  buildReplayBindingContext,
  certifyReplayReadiness,
  deriveReplayBindingHash,
} from "@/services/planning/replay-binding";
import { buildReplayBindingFixture } from "@/tests/planning/replay-binding/helpers";

describe("derived replay binding hasher", () => {
  it("changes on semantic mutation", () => {
    const fixture = buildReplayBindingFixture();
    const context = buildReplayBindingContext(fixture);
    const binding = buildImmutableReplayBinding(fixture);
    const certification = certifyReplayReadiness({
      buildInput: fixture,
      binding,
      runtimeValid: true,
      trustZoneValid: true,
    }).certification;

    const first = deriveReplayBindingHash({ context, binding, certification });
    const second = deriveReplayBindingHash({
      context,
      binding: {
        ...binding,
        runtimeFingerprintHash: "mutated",
      },
      certification,
    });
    expect(first).not.toBe(second);
  });
});
