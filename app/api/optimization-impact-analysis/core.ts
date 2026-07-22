import {
  buildOptimizationImpactObservabilitySurface,
  getOptimizationImpactAnalysis,
  listBenefitEstimations,
  listConstraintPreservationRecords,
  listResourceImpactReports,
  listRiskAssessmentReports,
  runOptimizationImpactAnalysis,
  validateOptimizationImpactAnalysis,
} from "@/services/optimization-impact-analysis";
import { discoverOptimizationOpportunities } from "@/services/optimization-opportunity-discovery";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { OptimizationImpactAnalysisLedger, OptimizationImpactInput } from "@/types/optimization-impact-analysis";
import type { OptimizationOpportunityRegistry } from "@/types/optimization-opportunity-discovery";

export async function requireOptimizationImpactUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function ledgerFromBody(body: Record<string, unknown>): OptimizationImpactAnalysisLedger {
  return (body.ledger as OptimizationImpactAnalysisLedger | undefined) ?? runOptimizationImpactAnalysis(body as OptimizationImpactInput);
}

function registryFromBody(body: Record<string, unknown>): OptimizationOpportunityRegistry | null {
  return (body.registry as OptimizationOpportunityRegistry | null | undefined) ?? discoverOptimizationOpportunities();
}

export function contractResponse() { return getOptimizationImpactAnalysis(); }
export async function analyzeRequest(request: Request) { return runOptimizationImpactAnalysis((await readBody(request)) as OptimizationImpactInput); }
export async function benefitsRequest(request: Request) { return listBenefitEstimations((await readBody(request)) as OptimizationImpactInput); }
export async function resourcesRequest(request: Request) { return listResourceImpactReports((await readBody(request)) as OptimizationImpactInput); }
export async function risksRequest(request: Request) { return listRiskAssessmentReports((await readBody(request)) as OptimizationImpactInput); }
export async function constraintsRequest(request: Request) { return listConstraintPreservationRecords((await readBody(request)) as OptimizationImpactInput); }
export async function validateRequest(request: Request) {
  const body = await readBody(request);
  return validateOptimizationImpactAnalysis(ledgerFromBody(body), registryFromBody(body));
}
export async function inspectRequest(request?: Request) {
  if (!request) return buildOptimizationImpactObservabilitySurface();
  return buildOptimizationImpactObservabilitySurface(ledgerFromBody(await readBody(request)));
}
