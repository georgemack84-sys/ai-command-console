import { z } from "zod";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";
import type { NuruRunBudgetLedger } from "@/src/server/services/nuru-run-budget-service";

const specialistSchema = z.enum(["DISCOVERY", "CONTEXT", "CONNECTION", "QUALITY"]);
const workflowSchema = z.enum(["FAST", "STANDARD"]);
const dispatchSchema = z.object({ coordinator: z.literal("nuru.curator.v1"), workflow: workflowSchema, sequence: z.number().int().positive(), specialist: specialistSchema, resourceId: z.string().min(1), correlationId: z.string().min(1) });
export type CollaborationDispatch = z.infer<typeof dispatchSchema>;
const workflowSteps = { FAST: ["DISCOVERY", "CONTEXT"], STANDARD: ["DISCOVERY", "CONTEXT", "CONNECTION", "QUALITY"] } as const;

/** Curator-only, one-way orchestration. Specialists never receive a peer messaging capability. */
export const NuruAgentCollaborationProtocol = {
  assertDispatch(rawDispatch: unknown) {
    const dispatch = dispatchSchema.parse(rawDispatch);
    const expected = workflowSteps[dispatch.workflow][dispatch.sequence - 1];
    if (expected !== dispatch.specialist) throw new Error(`Invalid ${dispatch.workflow} collaboration step ${dispatch.sequence}: expected ${expected ?? "no further specialist"}.`);
    return dispatch;
  },

  async dispatch<T>(rawDispatch: CollaborationDispatch, operation: () => Promise<T>, budget?: NuruRunBudgetLedger) {
    const dispatch = this.assertDispatch(rawDispatch);
    budget?.reserve({ agents: 1, modelCalls: 1, tokens: 3_000, toolCalls: 3 });
    await NuruAuditService.record({ operation: "AGENT_DISPATCHED", actor: dispatch.coordinator, resourceId: dispatch.resourceId, inputReference: dispatch.workflow, outputReference: dispatch.specialist, decision: "ORCHESTRATED", reason: `Curator dispatched ${dispatch.specialist} at bounded workflow step ${dispatch.sequence}.`, correlationId: dispatch.correlationId });
    const result = await operation();
    const status = typeof result === "object" && result !== null && "status" in result ? String(result.status) : "completed";
    await NuruAuditService.record({ operation: "AGENT_RESULT_RECEIVED", actor: dispatch.coordinator, resourceId: dispatch.resourceId, inputReference: dispatch.specialist, outputReference: status, decision: "CURATOR_OWNED", reason: `Curator received the ${dispatch.specialist} result; no peer-to-peer delivery occurred.`, correlationId: dispatch.correlationId });
    return result;
  },
};
