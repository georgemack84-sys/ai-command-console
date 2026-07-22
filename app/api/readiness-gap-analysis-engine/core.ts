import {
  analyzeReadinessGaps,
  buildReadinessGapObservabilitySurface,
  getReadinessGapAnalysisBundle,
  listImprovementPriorities,
  listReadinessDependencies,
  listReadinessGapLedger,
  listReadinessGaps,
  validateReadinessGapAnalysis,
} from "@/services/readiness-gap-analysis-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ReadinessGapAnalysisRepository, ReadinessGapInput } from "@/types/readiness-gap-analysis-engine";

export async function requireReadinessGapUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): ReadinessGapAnalysisRepository {
  return (body.repository as ReadinessGapAnalysisRepository | undefined) ?? analyzeReadinessGaps(body as ReadinessGapInput);
}

export function readinessBundleResponse() { return getReadinessGapAnalysisBundle(); }
export async function analyzeRequest(request: Request) { return analyzeReadinessGaps((await readBody(request)) as ReadinessGapInput); }
export async function gapsRequest(request: Request) { return listReadinessGaps((await readBody(request)) as ReadinessGapInput); }
export async function dependenciesRequest(request: Request) { return listReadinessDependencies((await readBody(request)) as ReadinessGapInput); }
export async function prioritiesRequest(request: Request) { return listImprovementPriorities((await readBody(request)) as ReadinessGapInput); }
export async function ledgerRequest(request: Request) { return listReadinessGapLedger((await readBody(request)) as ReadinessGapInput); }
export async function validateRequest(request: Request) { return validateReadinessGapAnalysis(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildReadinessGapObservabilitySurface();
  return buildReadinessGapObservabilitySurface(repositoryFromBody(await readBody(request)));
}
