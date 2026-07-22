import { getSyntheticEnvironmentArchitectureBundle, runSyntheticEnvironmentArchitecture, validateSyntheticEnvironmentArchitecture } from "@/services/synthetic-environment-architecture";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SyntheticEnvironmentArchitectureInput, SyntheticEnvironmentArchitectureResult } from "@/types/synthetic-environment-architecture";

export async function requireSyntheticEnvironmentArchitectureUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): SyntheticEnvironmentArchitectureInput { return body as SyntheticEnvironmentArchitectureInput; }
function resultFromBody(body: Record<string, unknown>): SyntheticEnvironmentArchitectureResult { return (body.result as SyntheticEnvironmentArchitectureResult | undefined) ?? runSyntheticEnvironmentArchitecture(inputFromBody(body)); }

export function contractResponse() { return getSyntheticEnvironmentArchitectureBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runSyntheticEnvironmentArchitecture(); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticEnvironmentArchitecture(); return { registry: result.registry, environment: result.environment, version_registry: result.version_registry }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticEnvironmentArchitecture(); return { lifecycle: result.lifecycle }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticEnvironmentArchitecture(); return { qualification: result.qualification }; }
export async function isolationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticEnvironmentArchitecture(); return { isolation: result.isolation }; }
export async function configurationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticEnvironmentArchitecture(); return { configuration: result.configuration, version_registry: result.version_registry }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticEnvironmentArchitecture(); return { replay: result.replay, replay_hash: result.replay_hash }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticEnvironmentArchitecture(); return { audit_ledger: result.audit_ledger, invariants: result.invariants }; }
export async function validateRequest(request: Request) { return validateSyntheticEnvironmentArchitecture(resultFromBody(await readBody(request))); }
