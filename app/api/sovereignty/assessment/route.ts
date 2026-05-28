import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTenantApiContext } from "@/src/server/api/tenantApiContext";
import { normalizeTenantApiError } from "@/src/server/api/tenantApiErrors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildExecutiveOperationsAggregator } from "@/services/executive/executiveOperationsAggregator";
import { buildConstitutionalResilienceEngine } from "@/services/resilience/constitutionalResilienceEngine";
import { evaluateConstitutionalReadiness } from "@/services/readiness/constitutionalReadiness";
import { buildConstitutionalSovereigntyEngine } from "@/services/sovereignty/constitutionalSovereigntyEngine";
import { validateConstitutionalOperation } from "@/services/validation/constitutionalOperationalValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const tenantContext = requireTenantApiContext({ request, user });
    const executive = await buildExecutiveOperationsAggregator({ tenantContext, operatorId: user.id });
    const nowMs = Date.now();
    const resilience = buildConstitutionalResilienceEngine({ executiveModel: executive, nowMs });
    const readiness = evaluateConstitutionalReadiness({ resilience, executive, nowMs });
    const sovereignty = buildConstitutionalSovereigntyEngine({ executive, resilience, readiness, nowMs });
    const validation = validateConstitutionalOperation({
      sovereigntyState: sovereignty.assessment.sovereigntyState,
      constitutionalIntegrity: sovereignty.assessment.constitutionalIntegrity,
      governanceReliability: sovereignty.assessment.governanceReliability,
      containmentIntegrity: 1 - sovereignty.assessment.containmentPressure,
      operationalStability: sovereignty.assessment.operationalStability,
      immutableAuditVerified: sovereignty.assessment.immutableAuditHealthy,
      autonomyRisk: sovereignty.assessment.autonomyRisk,
      disputedSystems: sovereignty.assessment.unstableSystems,
      createdAt: nowMs,
    });
    return apiSuccess({
      sovereignty: sovereignty.assessment,
      validation,
      advisoryOnly: true,
    });
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to load sovereignty assessment.");
  }
}
