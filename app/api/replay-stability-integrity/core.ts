import { getReplayStabilityIntegrityBundle, runReplayStabilityIntegrity, validateReplayStabilityIntegrity } from "@/services/replay-stability-integrity";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ReplayStabilityIntegrityInput, ReplayStabilityIntegrityResult } from "@/types/replay-stability-integrity";

export async function requireReplayStabilityIntegrityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ReplayStabilityIntegrityInput { return body as ReplayStabilityIntegrityInput; }
function resultFromBody(body: Record<string, unknown>): ReplayStabilityIntegrityResult { return (body.result as ReplayStabilityIntegrityResult | undefined) ?? runReplayStabilityIntegrity(inputFromBody(body)); }

export function contractResponse() { return getReplayStabilityIntegrityBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runReplayStabilityIntegrity(); }
export async function monitorRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayStabilityIntegrity(); return { stability_monitor: result.stability_monitor, stability_record: result.stability_record }; }
export async function regressionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayStabilityIntegrity(); return { regression_engine: result.regression_engine }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayStabilityIntegrity(); return { integrity_validator: result.integrity_validator }; }
export async function baselinesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayStabilityIntegrity(); return { baseline_registry: result.baseline_registry }; }
export async function divergenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayStabilityIntegrity(); return { divergence_analysis: result.divergence_analysis }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayStabilityIntegrity(); return { evidence_service: result.evidence_service }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayStabilityIntegrity(); return { stability_ledger: result.stability_ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayStabilityIntegrity(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateReplayStabilityIntegrity(resultFromBody(await readBody(request))); }
