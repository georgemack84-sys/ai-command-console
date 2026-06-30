import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildEscalationPrioritizationMetrics,
  buildEscalationPrioritizationObservabilitySurface,
  computeEscalationPrioritizationHash,
  getEscalationPrioritizationContract,
  prioritizeEscalations,
  replayEscalationPrioritization,
  validateEscalationPrioritization,
} from "@/services/escalation-prioritization";
import type { EscalationPrioritizationResult, EscalationPrioritizationScenario } from "@/types/escalation-prioritization";

export async function requireEscalationPrioritizationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getEscalationPrioritizationContractResponse() {
  return getEscalationPrioritizationContract();
}

export async function prioritizeEscalationsRequest(request: Request) {
  const body = await readBody(request) as { tenant_id?: string; mission_id?: string; scenario?: EscalationPrioritizationScenario };
  return prioritizeEscalations(body);
}

export async function validateEscalationPrioritizationRequest(request: Request) {
  const body = await readBody(request);
  return validateEscalationPrioritization(Object.keys(body).length ? body as Partial<EscalationPrioritizationResult> : prioritizeEscalations());
}

export async function replayEscalationPrioritizationRequest(request: Request) {
  const body = await readBody(request);
  return replayEscalationPrioritization(Object.keys(body).length ? body as EscalationPrioritizationResult : prioritizeEscalations());
}

export async function hashEscalationPrioritizationRequest(request: Request) {
  const body = await readBody(request);
  const result = Object.keys(body).length ? body as EscalationPrioritizationResult : prioritizeEscalations();
  return { escalation_prioritization_hash: computeEscalationPrioritizationHash(result) };
}

export async function metricsEscalationPrioritizationRequest(request?: Request) {
  if (!request) return buildEscalationPrioritizationMetrics();
  const body = await readBody(request);
  return buildEscalationPrioritizationMetrics(Object.keys(body).length ? body as EscalationPrioritizationResult : prioritizeEscalations());
}

export async function inspectEscalationPrioritizationRequest(request?: Request) {
  if (!request) return buildEscalationPrioritizationObservabilitySurface();
  const body = await readBody(request);
  return buildEscalationPrioritizationObservabilitySurface(Object.keys(body).length ? body as EscalationPrioritizationResult : prioritizeEscalations());
}
