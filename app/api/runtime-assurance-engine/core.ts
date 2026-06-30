import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRuntimeAssuranceDashboardSurface,
  buildRuntimeAssurancePackage,
  computeRuntimeAssuranceEvidenceHash,
  getRuntimeAssuranceFramework,
} from "@/services/runtime-assurance-engine";
import type { ExecutionAssuranceRecord } from "@/types/execution-assurance-contract";
import type { RuntimeAssurancePackage, RuntimeAssuranceScenario } from "@/types/runtime-assurance-engine";

export async function requireRuntimeAssuranceEngineUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function packageFromBody(body: Record<string, unknown>): RuntimeAssurancePackage {
  return (body.package as RuntimeAssurancePackage | undefined) ?? buildRuntimeAssurancePackage({
    scenario: body.scenario as RuntimeAssuranceScenario | undefined,
    assuranceRecord: body.assuranceRecord as ExecutionAssuranceRecord | undefined,
  });
}

export function getRuntimeAssuranceContractResponse() {
  return getRuntimeAssuranceFramework();
}

export async function createRuntimeAssurancePackageRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body);
}

export async function runtimeHealthReportRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).health_report;
}

export async function executionValidationReportRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).execution_validation_report;
}

export async function runtimeAssuranceEvidenceRequest(request: Request) {
  const body = await readBody(request);
  const pkg = packageFromBody(body);
  return {
    evidence: pkg.assurance_evidence,
    runtime_assurance_evidence_hash: computeRuntimeAssuranceEvidenceHash(pkg.assurance_evidence),
  };
}

export async function runtimeAssuranceDashboardRequest(request?: Request) {
  if (!request) return buildRuntimeAssuranceDashboardSurface();
  const body = await readBody(request);
  return buildRuntimeAssuranceDashboardSurface(packageFromBody(body));
}

export async function runtimeAssuranceReplayRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).replay;
}
