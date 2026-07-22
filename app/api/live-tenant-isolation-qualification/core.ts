import { getLiveTenantIsolationQualificationBundle, runLiveTenantIsolationQualification, validateLiveTenantIsolationQualification } from "@/services/live-tenant-isolation-qualification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { LiveTenantIsolationInput, LiveTenantIsolationResult } from "@/types/live-tenant-isolation-qualification";

export async function requireLiveTenantIsolationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): LiveTenantIsolationInput { return body as LiveTenantIsolationInput; }
function resultFromBody(body: Record<string, unknown>): LiveTenantIsolationResult { return (body.result as LiveTenantIsolationResult | undefined) ?? runLiveTenantIsolationQualification(inputFromBody(body)); }

export function contractResponse() { return getLiveTenantIsolationQualificationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runLiveTenantIsolationQualification(); }
export async function monitorRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLiveTenantIsolationQualification(); return { observation: result.observation, attestation: result.attestation }; }
export async function detectorRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLiveTenantIsolationQualification(); return { detector: result.detector, replay: result.replay }; }
export async function incidentsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLiveTenantIsolationQualification(); return { incident_registry: result.incident_registry }; }
export async function containmentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLiveTenantIsolationQualification(); return { containment: result.containment }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLiveTenantIsolationQualification(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateLiveTenantIsolationQualification(resultFromBody(await readBody(request))); }
