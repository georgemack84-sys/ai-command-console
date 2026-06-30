import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAutonomyContract,
  buildAutonomyObservabilitySurface,
  buildAutonomyRegistry,
  computeAutonomyIntegrityHash,
  getAutonomyContract,
  getAutonomyVersionPolicy,
  validateAutonomyContract,
} from "@/services/autonomy-contract";
import type { AutonomyContract, AutonomyContractScenario } from "@/types/autonomy-contract";

export async function requireAutonomyContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function contractFromBody(body: Record<string, unknown>) {
  return (body.contract as AutonomyContract | undefined) ?? buildAutonomyContract({ scenario: body.scenario as AutonomyContractScenario | undefined });
}

export function getAutonomyContractResponse() {
  return getAutonomyContract();
}

export async function createAutonomyContractRequest(request: Request) {
  const body = await readBody(request);
  return buildAutonomyContract({ scenario: body.scenario as AutonomyContractScenario | undefined });
}

export async function validateAutonomyContractRequest(request: Request) {
  const body = await readBody(request);
  const registry = body.registry as readonly AutonomyContract[] | undefined;
  return validateAutonomyContract(contractFromBody(body), { registry });
}

export async function hashAutonomyContractRequest(request: Request) {
  const body = await readBody(request);
  return { autonomy_integrity_hash: computeAutonomyIntegrityHash(contractFromBody(body)) };
}

export async function registryAutonomyContractRequest(request: Request) {
  const body = await readBody(request);
  const contracts = (body.contracts as readonly AutonomyContract[] | undefined) ?? [contractFromBody(body)];
  return buildAutonomyRegistry(contracts);
}

export function versionAutonomyContractResponse() {
  return getAutonomyVersionPolicy();
}

export async function inspectAutonomyContractRequest(request?: Request) {
  if (!request) return buildAutonomyObservabilitySurface();
  const body = await readBody(request);
  const contract = contractFromBody(body);
  return buildAutonomyObservabilitySurface(contract, (body.registry as readonly AutonomyContract[] | undefined) ?? [contract]);
}
