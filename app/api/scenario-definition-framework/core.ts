import { buildFailureProfile, buildScenarioObservabilitySurface, buildScenarioTemplate, createScenarioRegistry, getScenario, getScenarioDefinitionContract, replayScenario, searchScenarios, validateScenarioRegistry } from "@/services/scenario-definition-framework";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ScenarioDefinitionInput, ScenarioRegistry, ScenarioSearchCriteria, ScenarioType } from "@/types/scenario-definition-framework";

export async function requireScenarioDefinitionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function registryFromBody(body: Record<string, unknown>): ScenarioRegistry {
  return (body.registry as ScenarioRegistry | undefined) ?? createScenarioRegistry(body as ScenarioDefinitionInput);
}

export function contractResponse() { return getScenarioDefinitionContract(); }
export async function createRequest(request: Request) { return createScenarioRegistry((await readBody(request)) as ScenarioDefinitionInput); }
export async function templateRequest(request: Request) {
  const body = await readBody(request);
  return buildScenarioTemplate((body.scenario_type as ScenarioType | undefined) ?? "HARDWARE_FAILURE");
}
export async function failureProfileRequest(request: Request) {
  const body = await readBody(request);
  return buildFailureProfile((body.scenario_type as ScenarioType | undefined) ?? "HARDWARE_FAILURE", body as ScenarioDefinitionInput);
}
export async function validateRequest(request: Request) { return validateScenarioRegistry(registryFromBody(await readBody(request))); }
export async function replayRequest(request: Request) {
  const body = await readBody(request);
  return replayScenario(getScenario(registryFromBody(body), body.scenario_id as string | undefined));
}
export async function searchRequest(request: Request) {
  const body = await readBody(request);
  return searchScenarios((body.criteria as ScenarioSearchCriteria | undefined) ?? body, registryFromBody(body));
}
export async function inspectRequest(request?: Request) {
  if (!request) return buildScenarioObservabilitySurface();
  return buildScenarioObservabilitySurface(registryFromBody(await readBody(request)));
}
