import { getProductionEnvironmentQualificationBundle, runProductionEnvironmentQualification, validateProductionEnvironmentQualification } from "@/services/production-environment-qualification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProductionEnvironmentQualificationInput, ProductionEnvironmentQualificationResult } from "@/types/production-environment-qualification";

export async function requireProductionEnvironmentQualificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProductionEnvironmentQualificationInput { return body as ProductionEnvironmentQualificationInput; }
function resultFromBody(body: Record<string, unknown>): ProductionEnvironmentQualificationResult { return (body.result as ProductionEnvironmentQualificationResult | undefined) ?? runProductionEnvironmentQualification(inputFromBody(body)); }

export function contractResponse() { return getProductionEnvironmentQualificationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runProductionEnvironmentQualification(); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionEnvironmentQualification(); return { registry: result.registry, version_governance: result.version_governance }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionEnvironmentQualification(); return { qualification: result.qualification, lifecycle_governance: result.lifecycle_governance }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionEnvironmentQualification(); return { infrastructure_integrity: result.infrastructure_integrity, tenant_isolation: result.tenant_isolation }; }
export async function driftRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionEnvironmentQualification(); return { drift: result.drift, continuous_qualification: result.continuous_qualification }; }
export async function attestationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionEnvironmentQualification(); return { attestation: result.attestation, observability: result.observability }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionEnvironmentQualification(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateProductionEnvironmentQualification(resultFromBody(await readBody(request))); }
