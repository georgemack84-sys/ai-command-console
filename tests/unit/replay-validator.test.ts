import { describe, expect, it } from "vitest";
import { z } from "zod";

import { validateReplayPayload } from "../../services/contracts/replayValidator.ts";

describe("replay validator", () => {
  it("accepts historically compatible payloads", () => {
    const result = validateReplayPayload({
      contractId: "sam.proposal",
      version: "1.0.0",
      schema: z.object({
        executionId: z.string(),
      }).strict(),
      payload: {
        executionId: "demo-1",
      },
    });

    expect(result.ok).toBe(true);
  });

  it("fails closed on replay drift", () => {
    const result = validateReplayPayload({
      contractId: "sam.proposal",
      version: "1.0.0",
      schema: z.object({
        executionId: z.string(),
      }).strict(),
      payload: {
        executionId: 1,
      },
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("API_REPLAY_FAILED");
  });
});
