import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildDelegationContract,
  buildDelegationObservabilitySurface,
  buildDelegationRegistry,
  computeDelegationIntegrityHash,
  getDelegationContractFramework,
  getDelegationVersionPolicy,
  replayDelegationContract,
  validateDelegationContract,
} from "@/services/delegation-contract";
import type { DelegationContract, DelegationContractScenario } from "@/types/delegation-contract";

export async function requireDelegationContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function contractFromBody(body: Record<string, unknown>) {
  return (body.contract as DelegationContract | undefined) ?? buildDelegationContract({ scenario: body.scenario as DelegationContractScenario | undefined });
}

export function getDelegationContractResponse() {
  return getDelegationContractFramework();
}

export async function createDelegationContractRequest(request: Request) {
  const body = await readBody(request);
  return buildDelegationContract({ scenario: body.scenario as DelegationContractScenario | undefined });
}

export async function validateDelegationContractRequest(request: Request) {
  const body = await readBody(request);
  const contract = contractFromBody(body);
  return validateDelegationContract(contract, { registry: (body.registry as readonly DelegationContract[] | undefined) ?? [contract] });
}

export async function replayDelegationContractRequest(request: Request) {
  const body = await readBody(request);
  return replayDelegationContract(contractFromBody(body));
}

export async function hashDelegationContractRequest(request: Request) {
  const body = await readBody(request);
  return { delegation_integrity_hash: computeDelegationIntegrityHash(contractFromBody(body)) };
}

export async function registryDelegationContractRequest(request: Request) {
  const body = await readBody(request);
  const contract = contractFromBody(body);
  return buildDelegationRegistry((body.contracts as readonly DelegationContract[] | undefined) ?? [contract]);
}

export function versionDelegationContractResponse() {
  return getDelegationVersionPolicy();
}

export async function inspectDelegationContractRequest(request?: Request) {
  if (!request) return buildDelegationObservabilitySurface();
  const body = await readBody(request);
  const contract = contractFromBody(body);
  return buildDelegationObservabilitySurface(contract, (body.registry as readonly DelegationContract[] | undefined) ?? [contract]);
}
