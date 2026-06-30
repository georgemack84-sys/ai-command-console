import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildEscalationDetectionMetrics,
  buildEscalationDetectionObservabilitySurface,
  computeEscalationDetectionHash,
  getEscalationDetectionContract,
  replayEscalationDetection,
  runEscalationDetection,
  validateEscalationDetection,
} from "@/services/escalation-detection";
import type { EscalationDetectionResult, EscalationDetectionScenario } from "@/types/escalation-detection";

export async function requireEscalationDetectionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getEscalationDetectionContractResponse() {
  return getEscalationDetectionContract();
}

export async function runEscalationDetectionRequest(request: Request) {
  const body = await readBody(request) as { tenant_id?: string; mission_id?: string; scenario?: EscalationDetectionScenario };
  return runEscalationDetection(body);
}

export async function validateEscalationDetectionRequest(request: Request) {
  const body = await readBody(request);
  return validateEscalationDetection(Object.keys(body).length ? body as Partial<EscalationDetectionResult> : runEscalationDetection());
}

export async function replayEscalationDetectionRequest(request: Request) {
  const body = await readBody(request);
  return replayEscalationDetection(Object.keys(body).length ? body as EscalationDetectionResult : runEscalationDetection());
}

export async function hashEscalationDetectionRequest(request: Request) {
  const body = await readBody(request);
  const result = Object.keys(body).length ? body as EscalationDetectionResult : runEscalationDetection();
  return { escalation_detection_hash: computeEscalationDetectionHash(result) };
}

export async function metricsEscalationDetectionRequest(request?: Request) {
  if (!request) return buildEscalationDetectionMetrics();
  const body = await readBody(request);
  return buildEscalationDetectionMetrics(Object.keys(body).length ? body as EscalationDetectionResult : runEscalationDetection());
}

export async function inspectEscalationDetectionRequest(request?: Request) {
  if (!request) return buildEscalationDetectionObservabilitySurface();
  const body = await readBody(request);
  return buildEscalationDetectionObservabilitySurface(Object.keys(body).length ? body as EscalationDetectionResult : runEscalationDetection());
}
