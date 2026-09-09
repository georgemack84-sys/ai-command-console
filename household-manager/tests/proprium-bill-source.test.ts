import { afterEach, describe, expect, it, vi } from "vitest";

import { createPropriumBill } from "../lib/realtime/proprium-bill-source";

const originalOrigin = process.env.NEXT_PUBLIC_PROPRIUM_API_ORIGIN;
const originalHouseholdId = process.env.NEXT_PUBLIC_PROPRIUM_HOUSEHOLD_ID;

afterEach(() => {
  process.env.NEXT_PUBLIC_PROPRIUM_API_ORIGIN = originalOrigin;
  process.env.NEXT_PUBLIC_PROPRIUM_HOUSEHOLD_ID = originalHouseholdId;
  vi.unstubAllGlobals();
});

describe("Proprium bill source", () => {
  it("protects bill mutations with Proprium's request header", async () => {
    process.env.NEXT_PUBLIC_PROPRIUM_API_ORIGIN = "https://proprium.test/";
    process.env.NEXT_PUBLIC_PROPRIUM_HOUSEHOLD_ID = "household-id";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "bill-id" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await createPropriumBill({ name: "Electric", amount: 25, dueDate: "2026-09-09" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://proprium.test/api/v1/households/household-id/bills",
      expect.objectContaining({
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-Proprium-CSRF": "1" },
        method: "POST",
        body: JSON.stringify({ name: "Electric", amount: 25, dueDate: "2026-09-09", notes: null }),
      }),
    );
  });

  it("explains when the signed-in user cannot access the configured household", async () => {
    process.env.NEXT_PUBLIC_PROPRIUM_API_ORIGIN = "https://proprium.test";
    process.env.NEXT_PUBLIC_PROPRIUM_HOUSEHOLD_ID = "household-id";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 403 })));

    await expect(createPropriumBill({ name: "Electric", amount: 25, dueDate: "2026-09-09" }))
      .rejects.toThrow("does not have access");
  });
});
