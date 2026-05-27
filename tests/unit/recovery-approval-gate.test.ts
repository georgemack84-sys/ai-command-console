import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { requiresApproval, validateApproval } = require("../../services/recoveryApprovalGate.js");

describe("recovery approval gate", () => {
  it("maps classifications to approval requirements", () => {
    expect(requiresApproval("SAFE_REPLAY")).toBe(false);
    expect(requiresApproval("IDEMPOTENT_REPLAY")).toBe(false);
    expect(requiresApproval("REQUIRES_OPERATOR")).toBe(true);
    expect(requiresApproval("UNSAFE_REPLAY")).toBe(true);
    expect(requiresApproval("CORRUPTED")).toBe(true);
    expect(requiresApproval("UNKNOWN")).toBe(true);
  });

  it("validates approval only for awaiting-approval requests", () => {
    expect(
      validateApproval({
        request: {
          recoveryRequestId: "recovery_1",
          status: "AWAITING_APPROVAL",
          policy: { requiresApproval: true },
        },
        approvedBy: "operator_7",
      }),
    ).toEqual({
      ok: true,
      data: {
        approvedBy: "operator_7",
        recoveryRequestId: "recovery_1",
      },
    });
  });

  it("fails closed when approval is missing or invalid", () => {
    expect(
      validateApproval({
        request: {
          recoveryRequestId: "recovery_1",
          status: "PREVIEWED",
          policy: { requiresApproval: true },
        },
        approvedBy: "operator_7",
      }),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        error: "BLOCKED_UNSAFE_RECOVERY",
      }),
    );

    expect(
      validateApproval({
        request: {
          recoveryRequestId: "recovery_1",
          status: "AWAITING_APPROVAL",
          policy: { requiresApproval: true },
        },
        approvedBy: "",
      }),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        error: "BLOCKED_UNSAFE_RECOVERY",
      }),
    );
  });
});
