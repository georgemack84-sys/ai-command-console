import {
  buildOptimizationRecommendationObservabilitySurface,
  getOptimizationRecommendationEngine,
  listOptimizationExplainabilityReports,
  listOptimizationImplementationPlans,
  listOptimizationRollbackStrategies,
  listOptimizationScores,
  runOptimizationRecommendationEngine,
  validateOptimizationRecommendationEngine,
} from "@/services/optimization-recommendation-engine";
import { runDeterministicOptimizationValidation } from "@/services/deterministic-optimization-validation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { DeterministicOptimizationValidationLedger } from "@/types/deterministic-optimization-validation";
import type { OptimizationRecommendationInput, OptimizationRecommendationLedger } from "@/types/optimization-recommendation-engine";

export async function requireOptimizationRecommendationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function ledgerFromBody(body: Record<string, unknown>): OptimizationRecommendationLedger {
  return (body.ledger as OptimizationRecommendationLedger | undefined) ?? runOptimizationRecommendationEngine(body as OptimizationRecommendationInput);
}

function validationLedgerFromBody(body: Record<string, unknown>): DeterministicOptimizationValidationLedger | null {
  return (body.validation_ledger as DeterministicOptimizationValidationLedger | null | undefined) ?? runDeterministicOptimizationValidation();
}

export function contractResponse() { return getOptimizationRecommendationEngine(); }
export async function recommendRequest(request: Request) { return runOptimizationRecommendationEngine((await readBody(request)) as OptimizationRecommendationInput); }
export async function scoresRequest(request: Request) { return listOptimizationScores((await readBody(request)) as OptimizationRecommendationInput); }
export async function explainabilityRequest(request: Request) { return listOptimizationExplainabilityReports((await readBody(request)) as OptimizationRecommendationInput); }
export async function implementationPlansRequest(request: Request) { return listOptimizationImplementationPlans((await readBody(request)) as OptimizationRecommendationInput); }
export async function rollbackStrategiesRequest(request: Request) { return listOptimizationRollbackStrategies((await readBody(request)) as OptimizationRecommendationInput); }
export async function ledgerRequest(request: Request) { return runOptimizationRecommendationEngine((await readBody(request)) as OptimizationRecommendationInput); }
export async function validateRequest(request: Request) {
  const body = await readBody(request);
  return validateOptimizationRecommendationEngine(ledgerFromBody(body), validationLedgerFromBody(body));
}
export async function inspectRequest(request?: Request) {
  if (!request) return buildOptimizationRecommendationObservabilitySurface();
  return buildOptimizationRecommendationObservabilitySurface(ledgerFromBody(await readBody(request)));
}
