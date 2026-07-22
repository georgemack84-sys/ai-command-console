import { getPerformanceScalabilityValidationBundle, runPerformanceScalabilityValidation, validatePerformanceScalabilityValidation } from "@/services/performance-scalability-validation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PerformanceScalabilityValidationInput, PerformanceScalabilityValidationResult } from "@/types/performance-scalability-validation";

export async function requirePerformanceScalabilityValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PerformanceScalabilityValidationInput { return body as PerformanceScalabilityValidationInput; }
function resultFromBody(body: Record<string, unknown>): PerformanceScalabilityValidationResult { return (body.result as PerformanceScalabilityValidationResult | undefined) ?? runPerformanceScalabilityValidation(inputFromBody(body)); }

export function contractResponse() { return getPerformanceScalabilityValidationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runPerformanceScalabilityValidation(); }
export async function frameworkRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPerformanceScalabilityValidation(); return { load_profile: result.load_profile, workload_generator: result.workload_generator, scalability_framework: result.scalability_framework }; }
export async function throughputRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPerformanceScalabilityValidation(); return { throughput_validator: result.throughput_validator }; }
export async function latencyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPerformanceScalabilityValidation(); return { latency_analyzer: result.latency_analyzer, thresholds: result.thresholds }; }
export async function capacityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPerformanceScalabilityValidation(); return { capacity_suite: result.capacity_suite, validation_record: result.validation_record }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPerformanceScalabilityValidation(); return { evidence_ledger: result.evidence_ledger, dashboard: result.dashboard }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPerformanceScalabilityValidation(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validatePerformanceScalabilityValidation(resultFromBody(await readBody(request))); }
