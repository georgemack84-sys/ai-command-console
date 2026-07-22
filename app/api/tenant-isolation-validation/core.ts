import { getTenantIsolationValidationBundle, runTenantIsolationValidation, validateTenantIsolationValidation } from "@/services/tenant-isolation-validation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TenantIsolationValidationInput, TenantIsolationValidationResult } from "@/types/tenant-isolation-validation";

export async function requireTenantIsolationValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TenantIsolationValidationInput { return body as TenantIsolationValidationInput; }
function resultFromBody(body: Record<string, unknown>): TenantIsolationValidationResult { return (body.result as TenantIsolationValidationResult | undefined) ?? runTenantIsolationValidation(inputFromBody(body)); }

export function contractResponse() { return getTenantIsolationValidationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runTenantIsolationValidation(); }
export async function validationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTenantIsolationValidation(); return { validation_record: result.validation_record }; }
export async function violationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTenantIsolationValidation(); return { violations: result.violations }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTenantIsolationValidation(); return { replay: result.replay, replay_hash: result.replay_hash }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTenantIsolationValidation(); return { evidence_registry: result.evidence_registry, explanation: result.explanation }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTenantIsolationValidation(); return { governance: result.governance }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTenantIsolationValidation(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateTenantIsolationValidation(resultFromBody(await readBody(request))); }
