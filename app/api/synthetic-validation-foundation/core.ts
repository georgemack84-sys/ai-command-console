import { getSyntheticValidationFoundationBundle, runSyntheticValidationFoundation, validateSyntheticValidationFoundation } from "@/services/synthetic-validation-foundation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SyntheticValidationFoundationResult, SyntheticValidationInput } from "@/types/synthetic-validation-foundation";

export async function requireSyntheticValidationFoundationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): SyntheticValidationInput { return body as SyntheticValidationInput; }
function resultFromBody(body: Record<string, unknown>): SyntheticValidationFoundationResult { return (body.result as SyntheticValidationFoundationResult | undefined) ?? runSyntheticValidationFoundation(inputFromBody(body)); }

export function contractResponse() { return getSyntheticValidationFoundationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runSyntheticValidationFoundation(); }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticValidationFoundation(); return { lifecycle: result.lifecycle }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticValidationFoundation(); return { registry_entry: result.registry_entry }; }
export async function identityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticValidationFoundation(); return { identity_record: result.identity_record }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticValidationFoundation(); return { governance: result.governance, advisory_constraints: result.advisory_constraints }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticValidationFoundation(); return { replay: result.replay, replay_hash: result.replay_hash }; }
export async function validateRequest(request: Request) { return validateSyntheticValidationFoundation(resultFromBody(await readBody(request))); }
