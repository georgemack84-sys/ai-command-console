import {
  analyzeMissionExperience,
  buildPatternAnalysisObservabilitySurface,
  getPatternDiscoveryExperienceAnalysisEngine,
  listExperienceCorrelations,
  listOperationalPatterns,
  listPatternAnalysisAudits,
  listPatternTrends,
  validatePatternAnalysis,
} from "@/services/pattern-discovery-experience-analysis";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PatternAnalysisInput, PatternAnalysisRepository } from "@/types/pattern-discovery-experience-analysis";

export async function requirePatternAnalysisUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): PatternAnalysisRepository {
  return (body.repository as PatternAnalysisRepository | undefined) ?? analyzeMissionExperience(body as PatternAnalysisInput);
}

export function contractResponse() { return getPatternDiscoveryExperienceAnalysisEngine(); }
export async function analyzeRequest(request: Request) { return analyzeMissionExperience((await readBody(request)) as PatternAnalysisInput); }
export async function patternsRequest(request: Request) { return listOperationalPatterns((await readBody(request)) as PatternAnalysisInput); }
export async function correlationsRequest(request: Request) { return listExperienceCorrelations((await readBody(request)) as PatternAnalysisInput); }
export async function trendsRequest(request: Request) { return listPatternTrends((await readBody(request)) as PatternAnalysisInput); }
export async function auditRequest(request: Request) { return listPatternAnalysisAudits((await readBody(request)) as PatternAnalysisInput); }
export async function validateRequest(request: Request) { return validatePatternAnalysis(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildPatternAnalysisObservabilitySurface();
  return buildPatternAnalysisObservabilitySurface(repositoryFromBody(await readBody(request)));
}
