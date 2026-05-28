import { describe, expect, it } from "vitest";
import { z } from "zod";

import { validateContractPayload } from "../../services/contracts/validateContract.ts";

describe("validate contract", () => {
  it("rejects unknown fields deterministically", () => {
    const result = validateContractPayload({
      schema: z.object({
        id: z.string(),
      }).strict(),
      payload: {
        id: "a",
        extra: true,
      },
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("API_UNKNOWN_FIELD");
  });

  it("accepts exact payloads", () => {
    const result = validateContractPayload({
      schema: z.object({
        id: z.string(),
      }).strict(),
      payload: {
        id: "a",
      },
    });

    expect(result.ok).toBe(true);
  });
});
