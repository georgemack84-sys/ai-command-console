import {
  getPlanningReasoningBundle,
  runPlanningReasoning,
  validatePlanningReasoning,
} from "@/services/caf-planning-reasoning";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PlanningReasoningInput, PlanningReasoningResult } from "@/types/caf-planning-reasoning";

export async function requirePlanningReasoningUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PlanningReasoningInput { return body as PlanningReasoningInput; }
function resultFromBody(body: Record<string, unknown>): PlanningReasoningResult { return (body.result as PlanningReasoningResult | undefined) ?? runPlanningReasoning(inputFromBody(body)); }

export function contractResponse() { return getPlanningReasoningBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runPlanningReasoning(); }
export async function validateRequest(request: Request) { return validatePlanningReasoning(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningReasoning(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function objectivesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningReasoning(); return { objective: result.objective, decomposition: result.decomposition }; }
export async function goalsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningReasoning(); return { goal_graph: result.goal_graph }; }
export async function plansRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningReasoning(); return { reasoning_pipeline: result.reasoning_pipeline, candidate_plan: result.candidate_plan, assumptions: result.assumptions, recommendation: result.recommendation }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningReasoning(); return { governance: result.governance, evidence: result.evidence, replay_validation: result.replay_validation, observability: result.observability }; }
