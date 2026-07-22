import {
  assessConstitutionalResilience,
  buildConstitutionalResilienceAssessmentObservabilitySurface,
  getConstitutionalResilienceAssessmentEngine,
  listConstitutionalAssessmentLedger,
  listConstitutionalResilienceExplanations,
  listConstitutionalResilienceScores,
  listConstitutionalResilienceTrends,
  validateConstitutionalResilienceAssessment,
} from "@/services/constitutional-resilience-assessment";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ConstitutionalResilienceAssessmentInput, ConstitutionalResilienceAssessmentRepository } from "@/types/constitutional-resilience-assessment";

export async function requireConstitutionalResilienceAssessmentUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): ConstitutionalResilienceAssessmentRepository {
  return (body.repository as ConstitutionalResilienceAssessmentRepository | undefined) ?? assessConstitutionalResilience(body as ConstitutionalResilienceAssessmentInput);
}

export function contractResponse() { return getConstitutionalResilienceAssessmentEngine(); }
export async function assessRequest(request: Request) { return assessConstitutionalResilience((await readBody(request)) as ConstitutionalResilienceAssessmentInput); }
export async function scoresRequest(request: Request) { return listConstitutionalResilienceScores((await readBody(request)) as ConstitutionalResilienceAssessmentInput); }
export async function trendsRequest(request: Request) { return listConstitutionalResilienceTrends((await readBody(request)) as ConstitutionalResilienceAssessmentInput); }
export async function explanationsRequest(request: Request) { return listConstitutionalResilienceExplanations((await readBody(request)) as ConstitutionalResilienceAssessmentInput); }
export async function ledgerRequest(request: Request) { return listConstitutionalAssessmentLedger((await readBody(request)) as ConstitutionalResilienceAssessmentInput); }
export async function validateRequest(request: Request) { return validateConstitutionalResilienceAssessment(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildConstitutionalResilienceAssessmentObservabilitySurface();
  return buildConstitutionalResilienceAssessmentObservabilitySurface(repositoryFromBody(await readBody(request)));
}
