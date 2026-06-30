import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  appendReplayAuditLog,
  buildDeterministicReplayConfig,
  buildGovernanceReplayContract,
  buildGovernanceReplayObservabilitySurface,
  buildReplayReferenceRegistry,
  computeGovernanceReplayHash,
  getGovernanceReplayContract,
  resolveReplayDependencies,
  validateGovernanceReplayContract,
  validateReplayAuthorization,
} from "@/services/governance-replay-contract";
import type { GovernanceReplayContract, GovernanceReplayEngineInput } from "@/types/governance-replay-contract";

export async function requireGovernanceReplayUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function contractFromBody(body: Record<string, unknown>) {
  return (body.contract as GovernanceReplayContract | undefined) ?? buildGovernanceReplayContract(body as GovernanceReplayEngineInput);
}

export function getGovernanceReplayContractResponse() {
  return getGovernanceReplayContract();
}

export async function createGovernanceReplayContractRequest(request: Request) {
  return buildGovernanceReplayContract(await readBody(request) as GovernanceReplayEngineInput);
}

export async function validateGovernanceReplayContractRequest(request: Request) {
  const body = await readBody(request);
  return validateGovernanceReplayContract(contractFromBody(body), body.registry as ReturnType<typeof buildReplayReferenceRegistry> | undefined);
}

export async function hashGovernanceReplayContractRequest(request: Request) {
  const body = await readBody(request);
  const contract = contractFromBody(body);
  return { governance_replay_contract_hash: computeGovernanceReplayHash(contract) };
}

export async function dependenciesGovernanceReplayContractRequest(request: Request) {
  const body = await readBody(request);
  return resolveReplayDependencies(contractFromBody(body));
}

export async function referencesGovernanceReplayContractRequest(request: Request) {
  const body = await readBody(request);
  return buildReplayReferenceRegistry(contractFromBody(body));
}

export async function configGovernanceReplayContractRequest(request: Request) {
  const body = await readBody(request);
  return buildDeterministicReplayConfig(contractFromBody(body));
}

export async function authorizeGovernanceReplayContractRequest(request: Request) {
  const body = await readBody(request);
  return validateReplayAuthorization(contractFromBody(body));
}

export async function auditGovernanceReplayContractRequest(request: Request) {
  const body = await readBody(request);
  return appendReplayAuditLog(contractFromBody(body));
}

export async function inspectGovernanceReplayContractRequest(request?: Request) {
  if (!request) return buildGovernanceReplayObservabilitySurface();
  const body = await readBody(request);
  return buildGovernanceReplayObservabilitySurface(contractFromBody(body));
}
