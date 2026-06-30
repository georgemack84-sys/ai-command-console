import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAutonomyStateModel,
  buildAutonomyStateVisibilitySurface,
  buildAutonomyTransitionLedger,
  buildCertifiedAutonomyLifecycle,
  getAutonomyStateMachine,
  initializeAutonomyState,
  replayAutonomyStateHistory,
  transitionAutonomyState,
  validateAutonomyTransition,
} from "@/services/autonomy-state-machine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import type { AutonomyOperationalState, AutonomyTransitionRequest, AutonomyTransitionScenario } from "@/types/autonomy-state-machine";

export async function requireAutonomyStateUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getAutonomyStateMachineResponse() {
  return getAutonomyStateMachine();
}

export function getAutonomyStateModelResponse() {
  return buildAutonomyStateModel();
}

export async function initializeAutonomyStateRequest() {
  return initializeAutonomyState(generateAutonomyIdentity());
}

export async function transitionAutonomyStateRequest(request: Request) {
  const body = await readBody(request);
  const context = buildCertifiedAutonomyLifecycle(generateAutonomyIdentity());
  return transitionAutonomyState(context, (body.next_state as AutonomyOperationalState | undefined) ?? "ARCHIVED", {
    scenario: body.scenario as AutonomyTransitionScenario | undefined,
    request: body.request as Partial<AutonomyTransitionRequest> | undefined,
  });
}

export async function validateAutonomyStateTransitionRequest(request: Request) {
  const body = await readBody(request);
  const context = initializeAutonomyState(generateAutonomyIdentity());
  const transition = transitionAutonomyState(context, (body.next_state as AutonomyOperationalState | undefined) ?? "INITIALIZED", { scenario: body.scenario as AutonomyTransitionScenario | undefined });
  return validateAutonomyTransition(context, transition.record);
}

export async function ledgerAutonomyStateRequest() {
  return buildAutonomyTransitionLedger(buildCertifiedAutonomyLifecycle(generateAutonomyIdentity()));
}

export async function replayAutonomyStateRequest() {
  return replayAutonomyStateHistory(buildAutonomyTransitionLedger(buildCertifiedAutonomyLifecycle(generateAutonomyIdentity())));
}

export async function visibilityAutonomyStateRequest() {
  return buildAutonomyStateVisibilitySurface(buildCertifiedAutonomyLifecycle(generateAutonomyIdentity()));
}
