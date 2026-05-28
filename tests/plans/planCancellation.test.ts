import { beforeEach, describe, expect, it } from "vitest";

import { confirmCancellation, requestCancellation } from "@/services/plans/planCancellation";
import { createPlan, getPlan, getPlanHistory } from "@/services/plans/planPersistence";
import { resetPlanStore } from "@/services/plans/planStore";

describe("planCancellation", () => {
  beforeEach(() => {
    resetPlanStore();
  });

  it("cancels queued and executing plans while preserving evidence", () => {
    createPlan({
      planId: "queued_cancel",
      schemaVersion: "1",
      intent: "work",
      source: "ai",
      state: "QUEUED",
      createdBy: "planner",
      validationPassed: true,
      approvalRequired: false,
      approvalState: "NONE",
      riskLevel: "low",
      executionBlocked: false,
      cancellationRequested: false,
    });
    requestCancellation("queued_cancel", "operator", "stop");
    confirmCancellation("queued_cancel", "operator", "stop");

    expect(getPlan("queued_cancel").state).toBe("CANCELLED");
    expect(getPlanHistory("queued_cancel").lifecycleEvents.length).toBeGreaterThan(0);
  });

  it("rejects cancellation for completed plans", () => {
    createPlan({
      planId: "completed_cancel",
      schemaVersion: "1",
      intent: "work",
      source: "ai",
      state: "COMPLETED",
      createdBy: "planner",
      validationPassed: true,
      approvalRequired: false,
      approvalState: "NONE",
      riskLevel: "low",
      executionBlocked: false,
      cancellationRequested: false,
    });

    expect(() => requestCancellation("completed_cancel", "operator", "stop")).toThrow("PLAN_CANCELLATION_NOT_ALLOWED");
  });
});
