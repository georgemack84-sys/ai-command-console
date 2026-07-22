import { getAdvisoryBoundaryValidationBundle, runAdvisoryBoundaryValidation, validateAdvisoryBoundaryValidation } from "@/services/advisory-boundary-validation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AdvisoryBoundaryValidationInput, AdvisoryBoundaryValidationResult } from "@/types/advisory-boundary-validation";

export async function requireAdvisoryBoundaryValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AdvisoryBoundaryValidationInput { return body as AdvisoryBoundaryValidationInput; }
function resultFromBody(body: Record<string, unknown>): AdvisoryBoundaryValidationResult { return (body.result as AdvisoryBoundaryValidationResult | undefined) ?? runAdvisoryBoundaryValidation(inputFromBody(body)); }

export function contractResponse() { return getAdvisoryBoundaryValidationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runAdvisoryBoundaryValidation(); }
export async function guardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdvisoryBoundaryValidation(); return { guard: result.guard }; }
export async function validationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdvisoryBoundaryValidation(); return { validation: result.validation }; }
export async function interfacesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdvisoryBoundaryValidation(); return { interfaces: result.interfaces }; }
export async function attacksRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdvisoryBoundaryValidation(); return { attacks: result.attacks }; }
export async function violationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdvisoryBoundaryValidation(); return { violations: result.violations }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdvisoryBoundaryValidation(); return { replay: result.replay, replay_hash: result.replay_hash }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdvisoryBoundaryValidation(); return { governance: result.governance, observability: result.observability }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdvisoryBoundaryValidation(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateAdvisoryBoundaryValidation(resultFromBody(await readBody(request))); }
