import {
  getLearningAdaptationBundle,
  runLearningAdaptation,
  validateLearningAdaptation,
} from "@/services/caf-learning-adaptation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { LearningAdaptationInput, LearningAdaptationResult } from "@/types/caf-learning-adaptation";

export async function requireLearningAdaptationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): LearningAdaptationInput { return body as LearningAdaptationInput; }
function resultFromBody(body: Record<string, unknown>): LearningAdaptationResult { return (body.result as LearningAdaptationResult | undefined) ?? runLearningAdaptation(inputFromBody(body)); }

export function contractResponse() { return getLearningAdaptationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runLearningAdaptation(); }
export async function validateRequest(request: Request) { return validateLearningAdaptation(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLearningAdaptation(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function proposalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLearningAdaptation(); return { proposal: result.proposal }; }
export async function assessmentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLearningAdaptation(); return { assessment: result.assessment, replay_validation: result.replay_validation }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLearningAdaptation(); return { lifecycle: result.lifecycle }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLearningAdaptation(); return { learning_record: result.learning_record }; }
export async function boundedRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLearningAdaptation(); return { bounded_improvement: result.bounded_improvement }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLearningAdaptation(); return { evidence_records: result.evidence_records }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLearningAdaptation(); return { governance_workflow: result.governance_workflow, telemetry: result.telemetry }; }
