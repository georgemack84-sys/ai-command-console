import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildTaskClassificationPackage,
  buildTaskClassificationVisibilitySurface,
  classifyDelegationTask,
  getTaskClassificationDecisionMatrix,
  getTaskClassificationFramework,
  getTaskClassificationRuleLibrary,
} from "@/services/task-classification-engine";
import type { DelegationContract } from "@/types/delegation-contract";
import type { TaskClassificationScenario } from "@/types/task-classification-engine";

export async function requireTaskClassificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getTaskClassificationResponse() {
  return getTaskClassificationFramework();
}

export async function classifyTaskRequest(request: Request) {
  const body = await readBody(request);
  return classifyDelegationTask({
    scenario: body.scenario as TaskClassificationScenario | undefined,
    delegation: body.delegation as DelegationContract | undefined,
  });
}

export async function packageTaskClassificationRequest(request: Request) {
  const body = await readBody(request);
  return buildTaskClassificationPackage({
    scenario: body.scenario as TaskClassificationScenario | undefined,
    delegation: body.delegation as DelegationContract | undefined,
  });
}

export function rulesTaskClassificationResponse() {
  return getTaskClassificationRuleLibrary();
}

export function matrixTaskClassificationResponse() {
  return getTaskClassificationDecisionMatrix();
}

export async function inspectTaskClassificationRequest(request?: Request) {
  if (!request) return buildTaskClassificationVisibilitySurface();
  return buildTaskClassificationVisibilitySurface(await packageTaskClassificationRequest(request));
}
