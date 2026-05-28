import { describe, expect, it } from "vitest";

import { createSamIdempotencyKey } from "../../services/sam/samIdempotencyKey.ts";
import { createSamProposal } from "../helpers/sam-fixtures";

describe("sam idempotency key", () => {
  it("same proposal produces same idempotency key", () => {
    const proposal = createSamProposal();
    const first = createSamIdempotencyKey({ proposal });
    const second = createSamIdempotencyKey({ proposal });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.data.idempotencyKey).toBe(second.data.idempotencyKey);
    }
  });

  it("different proposal produces different idempotency key", () => {
    const first = createSamIdempotencyKey({ proposal: createSamProposal() });
    const second = createSamIdempotencyKey({
      proposal: createSamProposal({ params: { nested: { beta: 3, alpha: 1 } } }),
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.data.idempotencyKey).not.toBe(second.data.idempotencyKey);
    }
  });

  it("missing executionId fails closed", () => {
    const result = createSamIdempotencyKey({
      proposal: createSamProposal({ executionId: "" }),
    });

    expect(result.ok).toBe(false);
  });
});
