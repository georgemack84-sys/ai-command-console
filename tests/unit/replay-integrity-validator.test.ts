import { describe, expect, it } from "vitest";

import { validateReplayIntegrity } from "../../services/recoveryVerification/replayIntegrityValidator";

describe("replay integrity validator", () => {
  it("fails closed on disputed replay state", () => {
    const result = validateReplayIntegrity({
      bundle: {
        state: "disputed",
        timeline: { meta: { matchesReadModel: false } },
        readModel: { ledger: { totalEvents: 1 } },
      },
      ledgerEvents: [],
    });

    expect(result.valid).toBe(false);
    expect(result.evidence).toEqual(expect.arrayContaining(["timeline:disputed", "ledger:missing"]));
  });
});
