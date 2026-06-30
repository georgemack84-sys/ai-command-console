import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildPlanExecutionLookupObservabilitySurface,
  getPlanExecutionLookupContract,
  runPlanExecutionLookup,
  validatePlanExecutionLookup,
} from "@/services/plan-execution-lookup";
import type { PlanExecutionLookupInput, PlanExecutionLookupResponse } from "@/types/plan-execution-lookup";

export async function requirePlanExecutionLookupUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): PlanExecutionLookupInput {
  return body as PlanExecutionLookupInput;
}

function responseFromBody(body: Record<string, unknown>): PlanExecutionLookupResponse {
  return (body.response as PlanExecutionLookupResponse | undefined) ?? runPlanExecutionLookup(inputFromBody(body));
}

export function getPlanExecutionLookupContractResponse() { return getPlanExecutionLookupContract(); }
export async function runPlanExecutionLookupRequest(request: Request) { return runPlanExecutionLookup(inputFromBody(await readBody(request))); }
export async function validatePlanExecutionLookupRequest(request: Request) { return validatePlanExecutionLookup(inputFromBody(await readBody(request))); }
export async function planLookupRequest(request: Request) { return responseFromBody(await readBody(request)).plan_record; }
export async function executionLookupRequest(request: Request) { return responseFromBody(await readBody(request)).execution_record; }
export async function timelineLookupRequest(request: Request) { return responseFromBody(await readBody(request)).timeline; }
export async function failureLookupRequest(request: Request) { return responseFromBody(await readBody(request)).failure_inspection; }
export async function inspectPlanExecutionLookupRequest(request?: Request) {
  if (!request) return buildPlanExecutionLookupObservabilitySurface();
  return buildPlanExecutionLookupObservabilitySurface(inputFromBody(await readBody(request)));
}
