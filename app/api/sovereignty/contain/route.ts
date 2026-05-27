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
import { buildSovereigntyAudit } from "@/services/sovereignty/sovereigntyAudit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
    return apiSuccess({
      ok: true,
      advisoryOnly: true,
      previewAction: "CONTAIN",
      blockedReasons: sovereignty.enforcement.requiredActions,
      constitutionalReasoning: sovereignty.policies.blockedReasons,
      audit: buildSovereigntyAudit({ assessment: sovereignty.assessment, lineageId: sovereignty.lineage.lineageId, createdAt: nowMs }),
    });
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to preview sovereignty containment.");
  }
}
