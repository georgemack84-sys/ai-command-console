import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRecoveryInterventionDashboardSurface,
  buildRecoveryInterventionPackage,
  computeRecoveryRecommendationHash,
  getRecoveryInterventionFramework,
} from "@/services/recovery-intervention-intelligence";
import type { GovernanceAssurancePackage } from "@/types/governance-assurance-engine";
import type { RuntimeAssurancePackage } from "@/types/runtime-assurance-engine";
import type { RecoveryInterventionPackage, RecoveryInterventionScenario } from "@/types/recovery-intervention-intelligence";

export async function requireRecoveryInterventionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function packageFromBody(body: Record<string, unknown>): RecoveryInterventionPackage {
  return (body.package as RecoveryInterventionPackage | undefined) ?? buildRecoveryInterventionPackage({
    scenario: body.scenario as RecoveryInterventionScenario | undefined,
    runtimePackage: body.runtimePackage as RuntimeAssurancePackage | undefined,
    governancePackage: body.governancePackage as GovernanceAssurancePackage | undefined,
  });
}

export function getRecoveryInterventionContractResponse() {
  return getRecoveryInterventionFramework();
}

export async function createRecoveryInterventionRecommendationRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body);
}

export async function recoveryConfidenceRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).confidence_assessment;
}

export async function interventionPriorityRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).priority_assessment;
}

export async function recoveryExplainabilityRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).explainability;
}

export async function recoveryEvidenceRequest(request: Request) {
  const body = await readBody(request);
  const pkg = packageFromBody(body);
  return {
    recommendation: pkg.recommendation,
    recovery_recommendation_hash: computeRecoveryRecommendationHash(pkg.recommendation),
  };
}

export async function recoveryDashboardRequest(request?: Request) {
  if (!request) return buildRecoveryInterventionDashboardSurface();
  const body = await readBody(request);
  return buildRecoveryInterventionDashboardSurface(packageFromBody(body));
}

export async function recoveryReplayRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).replay;
}
