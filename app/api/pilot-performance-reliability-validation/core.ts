import { getPilotPerformanceReliabilityValidationBundle, runPilotPerformanceReliabilityValidation, validatePilotPerformanceReliabilityValidation } from "@/services/pilot-performance-reliability-validation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PilotPerformanceReliabilityInput, PilotPerformanceReliabilityResult } from "@/types/pilot-performance-reliability-validation";

export async function requirePilotPerformanceReliabilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PilotPerformanceReliabilityInput { return body as PilotPerformanceReliabilityInput; }
function resultFromBody(body: Record<string, unknown>): PilotPerformanceReliabilityResult { return (body.result as PilotPerformanceReliabilityResult | undefined) ?? runPilotPerformanceReliabilityValidation(inputFromBody(body)); }

export function contractResponse() { return getPilotPerformanceReliabilityValidationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runPilotPerformanceReliabilityValidation(); }
export async function thresholdsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotPerformanceReliabilityValidation(); return { threshold_registry: result.threshold_registry, threshold_versions: result.threshold_versions, threshold_provenance: result.threshold_provenance }; }
export async function performanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotPerformanceReliabilityValidation(); return { performance_validator: result.performance_validator }; }
export async function reliabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotPerformanceReliabilityValidation(); return { reliability_analyzer: result.reliability_analyzer, capacity_monitor: result.capacity_monitor, availability_dashboard: result.availability_dashboard }; }
export async function vp1Request(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotPerformanceReliabilityValidation(); return { vp1_report: result.vp1_report }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotPerformanceReliabilityValidation(); return { threshold_evidence_ledger: result.threshold_evidence_ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotPerformanceReliabilityValidation(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validatePilotPerformanceReliabilityValidation(resultFromBody(await readBody(request))); }
