import { getContinuousOperationsFoundationBundle, runContinuousOperationsFoundation, validateContinuousOperationsFoundation } from "@/services/continuous-operations-foundation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ContinuousOperationsFoundationInput, ContinuousOperationsFoundationResult } from "@/types/continuous-operations-foundation";

export async function requireContinuousOperationsFoundationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ContinuousOperationsFoundationInput { return body as ContinuousOperationsFoundationInput; }
function resultFromBody(body: Record<string, unknown>): ContinuousOperationsFoundationResult { return (body.result as ContinuousOperationsFoundationResult | undefined) ?? runContinuousOperationsFoundation(inputFromBody(body)); }

export function contractResponse() { return getContinuousOperationsFoundationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runContinuousOperationsFoundation(); }
export async function identityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationsFoundation(); return { operational_identity: result.operational_identity }; }
export async function stateRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationsFoundation(); return { state_registry: result.state_registry, governance_rules: result.governance_rules }; }
export async function authorityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationsFoundation(); return { authority_registry: result.authority_registry, certification_inheritance: result.certification_inheritance }; }
export async function servicesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationsFoundation(); return { standing_service_registry: result.standing_service_registry }; }
export async function auditRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationsFoundation(); return { replay_contract: result.replay_contract, audit_contract: result.audit_contract }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationsFoundation(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateContinuousOperationsFoundation(resultFromBody(await readBody(request))); }
