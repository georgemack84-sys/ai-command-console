import { describe, expect, it } from "vitest";
import { requireSameOriginMutation } from "@/src/server/security/same-origin";

describe("same-origin mutation protection", () => {
  it("allows the configured application origin", () => {
    expect(() => requireSameOriginMutation(new Request("http://localhost:5050/api/nuru", { headers: { origin: "http://localhost:5050" } }))).not.toThrow();
  });

  it("rejects a cross-site origin", () => {
    expect(() => requireSameOriginMutation(new Request("http://localhost:5050/api/nuru", { headers: { origin: "https://attacker.example" } }))).toThrow(/not allowed/i);
  });
});
