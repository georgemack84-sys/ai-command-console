import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import {
  buildExecutionContract,
  buildExecutionContractVisibilitySurface,
  generateExecutionIdentity,
  getExecutionContractFramework,
  replayExecutionContract,
  validateExecutionContract,
  validateExecutionState,
} from "@/services/execution-contract";
import type { ExecutionContractScenario } from "@/types/execution-contract";

export async function requireExecutionContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function buildExecutionInputs(scenario?: ExecutionContractScenario) {
  const identity = generateAutonomyIdentity();
  const contract = buildExecutionContract(identity, undefined, scenario);
  return { identity, contract };
}

export function getExecutionContractResponse() {
  return getExecutionContractFramework();
}

export async function identityExecutionContractRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  return generateExecutionIdentity(identity, undefined, body.scenario as ExecutionContractScenario | undefined);
}

export async function contractExecutionContractRequest(request: Request) {
  const body = await readBody(request);
  return buildExecutionInputs(body.scenario as ExecutionContractScenario | undefined).contract;
}

export async function validateExecutionContractRequest(request: Request) {
  return validateExecutionContract(await contractExecutionContractRequest(request));
}

export async function stateExecutionContractRequest(request: Request) {
  return validateExecutionState(await contractExecutionContractRequest(request));
}

export async function replayExecutionContractRequest(request: Request) {
  return replayExecutionContract(await contractExecutionContractRequest(request));
}

export async function visibilityExecutionContractRequest(request: Request) {
  return buildExecutionContractVisibilitySurface(await contractExecutionContractRequest(request));
}
