import { describe, expect, it } from "vitest";

import { appendImmutableLedgerEntry, verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";

describe("immutableAuditLedger", () => {
  it("remains append-only through chained hashes", () => {
    const first = appendImmutableLedgerEntry({
      payload: { a: 1 },
      scope: "audit",
    });
    const second = appendImmutableLedgerEntry({
      payload: { b: 2 },
      previousHash: first.entryHash,
      scope: "audit",
    });

    expect(verifyImmutableLedgerChain([first, second])).toBe(true);
  });
});
