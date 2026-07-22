import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAdaptiveSafetyObservability,
  certifyAdaptiveSafety,
  getAdaptiveSafetyContract,
  validateAdaptiveSafetyCertification,
} from "@/services/adaptive-safety-certification";
import type { AdaptiveSafetyInput, AdaptiveSafetyResult } from "@/types/adaptive-safety-certification";

export async function requireAdaptiveSafetyUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AdaptiveSafetyInput { return body as AdaptiveSafetyInput; }
function resultFromBody(body: Record<string, unknown>): AdaptiveSafetyResult { return (body.result as AdaptiveSafetyResult | undefined) ?? certifyAdaptiveSafety(inputFromBody(body)); }
export function contractResponse() { return getAdaptiveSafetyContract(); }
export async function dashboardRequest(request: Request) { return certifyAdaptiveSafety(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateAdaptiveSafetyCertification(resultFromBody(await readBody(request))); }
export async function sectionRequest(request: Request, key: "record" | "hidden_learning_detection" | "behavioral_mutation_detection" | "replay_safety_validation" | "evidence_safety_validation" | "adaptive_drift_validation" | "containment_recovery_validation" | "certification_report" | "risk_assessment_report") { return resultFromBody(await readBody(request))[key]; }
export async function inspectRequest(request?: Request) { if (!request) return buildAdaptiveSafetyObservability(); return buildAdaptiveSafetyObservability(resultFromBody(await readBody(request))); }
