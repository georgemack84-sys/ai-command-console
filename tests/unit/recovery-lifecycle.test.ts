import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { transitionState } = require("../../services/recoveryLifecycle.js");

describe("recovery lifecycle", () => {
  it("allows valid lifecycle transitions", () => {
    expect(transitionState(null, "CREATE_REQUEST")).toEqual({ ok: true, data: { state: "REQUESTED" } });
    expect(transitionState("REQUESTED", "MARK_PREVIEWED")).toEqual({ ok: true, data: { state: "PREVIEWED" } });
    expect(transitionState("REQUESTED", "MARK_AWAITING_APPROVAL")).toEqual({ ok: true, data: { state: "AWAITING_APPROVAL" } });
    expect(transitionState("AWAITING_APPROVAL", "APPROVE")).toEqual({ ok: true, data: { state: "APPROVED" } });
    expect(transitionState("PREVIEWED", "COMMIT_SUCCESS")).toEqual({ ok: true, data: { state: "COMMITTED" } });
    expect(transitionState("APPROVED", "COMMIT_BLOCK")).toEqual({ ok: true, data: { state: "BLOCKED" } });
    expect(transitionState("REQUESTED", "CANCEL")).toEqual({ ok: true, data: { state: "CANCELLED" } });
  });

  it("rejects invalid transitions fail-closed", () => {
    expect(transitionState("REQUESTED", "APPROVE")).toEqual(
      expect.objectContaining({
        ok: false,
        error: "BLOCKED_UNSAFE_RECOVERY",
      }),
    );

    expect(transitionState("COMMITTED", "APPROVE")).toEqual(
      expect.objectContaining({
        ok: false,
        error: "BLOCKED_UNSAFE_RECOVERY",
      }),
    );
  });
});
