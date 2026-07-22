import {
  buildDeterministicOptimizationValidationObservabilitySurface,
  getDeterministicOptimizationValidation,
  listAuthorityValidationRecords,
  listConstitutionalValidationRecords,
  listDeterministicValidationRecords,
  listGovernanceValidationRecords,
  listMissionOutcomeEquivalenceRecords,
  listReplayComparisonRecords,
  listTenantValidationRecords,
  runDeterministicOptimizationValidation,
  validateDeterministicOptimizationValidation,
} from "@/services/deterministic-optimization-validation";
import { runOptimizationImpactAnalysis } from "@/services/optimization-impact-analysis";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { DeterministicOptimizationValidationInput, DeterministicOptimizationValidationLedger } from "@/types/deterministic-optimization-validation";
import type { OptimizationImpactAnalysisLedger } from "@/types/optimization-impact-analysis";

export async function requireDeterministicOptimizationValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function ledgerFromBody(body: Record<string, unknown>): DeterministicOptimizationValidationLedger {
  return (body.ledger as DeterministicOptimizationValidationLedger | undefined) ?? runDeterministicOptimizationValidation(body as DeterministicOptimizationValidationInput);
}

function impactLedgerFromBody(body: Record<string, unknown>): OptimizationImpactAnalysisLedger | null {
  return (body.impact_ledger as OptimizationImpactAnalysisLedger | null | undefined) ?? runOptimizationImpactAnalysis();
}

export function contractResponse() { return getDeterministicOptimizationValidation(); }
export async function validateRequest(request: Request) {
  const body = await readBody(request);
  return validateDeterministicOptimizationValidation(ledgerFromBody(body), impactLedgerFromBody(body));
}
export async function deterministicRequest(request: Request) { return listDeterministicValidationRecords((await readBody(request)) as DeterministicOptimizationValidationInput); }
export async function replayRequest(request: Request) { return listReplayComparisonRecords((await readBody(request)) as DeterministicOptimizationValidationInput); }
export async function governanceRequest(request: Request) { return listGovernanceValidationRecords((await readBody(request)) as DeterministicOptimizationValidationInput); }
export async function constitutionalRequest(request: Request) { return listConstitutionalValidationRecords((await readBody(request)) as DeterministicOptimizationValidationInput); }
export async function authorityRequest(request: Request) { return listAuthorityValidationRecords((await readBody(request)) as DeterministicOptimizationValidationInput); }
export async function tenantRequest(request: Request) { return listTenantValidationRecords((await readBody(request)) as DeterministicOptimizationValidationInput); }
export async function missionEquivalenceRequest(request: Request) { return listMissionOutcomeEquivalenceRecords((await readBody(request)) as DeterministicOptimizationValidationInput); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildDeterministicOptimizationValidationObservabilitySurface();
  return buildDeterministicOptimizationValidationObservabilitySurface(ledgerFromBody(await readBody(request)));
}
