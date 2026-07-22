import {
  buildAssessmentReplayObservabilitySurface,
  getAssessmentReplayExplainabilityBundle,
  getReplayAuditReport,
  getReplayCertificationPackage,
  getReplayExplanations,
  replayAssessmentWithExplainability,
  validateAssessmentReplayExplainability,
} from "@/services/assessment-replay-explainability";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AssessmentReplayInput, AssessmentReplayRepository } from "@/types/assessment-replay-explainability";

export async function requireAssessmentReplayUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): AssessmentReplayRepository {
  return (body.repository as AssessmentReplayRepository | undefined) ?? replayAssessmentWithExplainability(body as AssessmentReplayInput);
}

export function replayBundleResponse() { return getAssessmentReplayExplainabilityBundle(); }
export async function replayRequest(request: Request) { return replayAssessmentWithExplainability((await readBody(request)) as AssessmentReplayInput); }
export async function explainRequest(request: Request) { return getReplayExplanations((await readBody(request)) as AssessmentReplayInput); }
export async function auditRequest(request: Request) { return getReplayAuditReport((await readBody(request)) as AssessmentReplayInput); }
export async function packageRequest(request: Request) { return getReplayCertificationPackage((await readBody(request)) as AssessmentReplayInput); }
export async function validateRequest(request: Request) { return validateAssessmentReplayExplainability(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildAssessmentReplayObservabilitySurface();
  return buildAssessmentReplayObservabilitySurface(repositoryFromBody(await readBody(request)));
}
