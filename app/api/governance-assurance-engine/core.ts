import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceAssuranceDashboardSurface,
  buildGovernanceAssurancePackage,
  computeGovernanceAssuranceEvidenceHash,
  getGovernanceAssuranceFramework,
} from "@/services/governance-assurance-engine";
import type { RuntimeAssurancePackage } from "@/types/runtime-assurance-engine";
import type { GovernanceAssurancePackage, GovernanceAssuranceScenario } from "@/types/governance-assurance-engine";

export async function requireGovernanceAssuranceEngineUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function packageFromBody(body: Record<string, unknown>): GovernanceAssurancePackage {
  return (body.package as GovernanceAssurancePackage | undefined) ?? buildGovernanceAssurancePackage({
    scenario: body.scenario as GovernanceAssuranceScenario | undefined,
    runtimePackage: body.runtimePackage as RuntimeAssurancePackage | undefined,
  });
}

export function getGovernanceAssuranceContractResponse() {
  return getGovernanceAssuranceFramework();
}

export async function createGovernanceAssurancePackageRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body);
}

export async function governanceAssuranceReportRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).governance_report;
}

export async function governanceComplianceScoreRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).compliance_score;
}

export async function governanceAuthorityValidationRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).authority_validation;
}

export async function governanceAssuranceEvidenceRequest(request: Request) {
  const body = await readBody(request);
  const pkg = packageFromBody(body);
  return {
    evidence: pkg.assurance_evidence,
    governance_assurance_evidence_hash: computeGovernanceAssuranceEvidenceHash(pkg.assurance_evidence),
  };
}

export async function governanceAssuranceDashboardRequest(request?: Request) {
  if (!request) return buildGovernanceAssuranceDashboardSurface();
  const body = await readBody(request);
  return buildGovernanceAssuranceDashboardSurface(packageFromBody(body));
}

export async function governanceAssuranceReplayRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).replay;
}
