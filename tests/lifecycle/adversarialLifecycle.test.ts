import { describe, expect, it } from "vitest";
import { orchestrateBoundedIntentLifecycle } from "@/services/lifecycle/lifecycleTransitionEngine";
import { buildLifecycleFixture } from "./helpers";

describe("adversarial lifecycle constraints", () => {
  it("fails correlation escalation attack", () => {
    const { request } = buildLifecycleFixture({
      currentState: "review",
      nextState: "approved",
    });
    const attack = Object.freeze({
      ...request,
      proposal: Object.freeze({
        ...request.proposal,
        approval: Object.freeze({
          ...request.proposal.approval,
          valid: false,
        }),
      }),
      approvalValidation: Object.freeze({
        asserted: true as const,
        approvalState: "invalid" as const,
      }),
    });
    expect(orchestrateBoundedIntentLifecycle(attack).errors.map((error) => error.code)).toContain("LIFECYCLE_APPROVAL_MISMATCH");
  });

  it("fails replay gap attack", () => {
    const { request } = buildLifecycleFixture({
      existingLineage: Object.freeze({
        ledgerId: "ledger-gap",
        entries: Object.freeze([]),
        lineageHash: "ledger-gap-hash",
      }),
    });
    const result = orchestrateBoundedIntentLifecycle(request);
    expect(result.record.governanceDecision).toBe("DENY");
  });

  it("fails hidden repair attack", () => {
    const { request } = buildLifecycleFixture({
      currentState: "expired",
      nextState: "revalidate",
      metadata: Object.freeze({ autoRepair: true }),
    });
    expect(orchestrateBoundedIntentLifecycle(request).errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(["LIFECYCLE_AUTONOMOUS_REPAIR_REJECTED"]),
    );
  });

  it("fails scheduling emergence attack", () => {
    const { request } = buildLifecycleFixture({
      metadata: Object.freeze({ scheduleAt: "2026-05-18T00:00:00.000Z" }),
    });
    expect(orchestrateBoundedIntentLifecycle(request).errors.map((error) => error.code)).toContain("LIFECYCLE_SCHEDULING_REJECTED");
  });
});
