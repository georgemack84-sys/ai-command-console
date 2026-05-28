import { beforeEach, describe, expect, it } from "vitest";

import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { appendPlanAudit } from "@/services/plans/planAudit";
import { createPlan } from "@/services/plans/planPersistence";
import { readPlanAuditEntries, resetPlanStore } from "@/services/plans/planStore";

describe("planAudit", () => {
  beforeEach(() => {
    resetPlanStore();
  });

  it("appends audit events through the existing immutable ledger seam", () => {
    createPlan({
      planId: "audit_plan",
      schemaVersion: "1",
      intent: "work",
      source: "ai",
      state: "DRAFT",
      createdBy: "planner",
      validationPassed: false,
      approvalRequired: false,
      approvalState: "NONE",
      riskLevel: "low",
      executionBlocked: false,
      cancellationRequested: false,
    });

    appendPlanAudit({
      planId: "audit_plan",
      eventType: "plan.replay",
      details: { deterministic: true },
    });

    const entries = readPlanAuditEntries("audit_plan");
    expect(entries.length).toBeGreaterThan(0);
    expect(verifyImmutableLedgerChain(entries)).toBe(true);
    expect(entries.every((entry) => entry.ledgerId.startsWith("ledger:plan-lifecycle:"))).toBe(true);
  });
});
