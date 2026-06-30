import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceHashChain,
  buildGovernanceHashChainObservabilitySurface,
  canonicalizeGovernanceArtifact,
  classifyGovernanceHashChainFailure,
  generateGovernanceArtifactHash,
  getGovernanceHashChainContract,
  validateGovernanceHashChain,
} from "@/services/governance-hash-chain";
import type { GovernanceHashChainExecution, GovernanceHashChainFailureReason, GovernanceHashChainInput } from "@/types/governance-hash-chain";

export async function requireGovernanceHashChainUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): GovernanceHashChainInput {
  return body as GovernanceHashChainInput;
}

function executionFromBody(body: Record<string, unknown>): GovernanceHashChainExecution {
  return (body.execution as GovernanceHashChainExecution | undefined) ?? buildGovernanceHashChain(inputFromBody(body));
}

export function getGovernanceHashChainContractResponse() {
  return getGovernanceHashChainContract();
}

export async function buildGovernanceHashChainRequest(request: Request) {
  return buildGovernanceHashChain(inputFromBody(await readBody(request)));
}

export async function validateGovernanceHashChainRequest(request: Request) {
  const body = await readBody(request);
  return validateGovernanceHashChain(body.execution ? executionFromBody(body) : inputFromBody(body));
}

export async function serializeGovernanceHashChainRequest(request: Request) {
  const body = await readBody(request);
  const canonical = canonicalizeGovernanceArtifact(body.payload ?? body);
  return { canonical, hash_generation: generateGovernanceArtifactHash(canonical) };
}

export async function classifyGovernanceHashChainRequest(request: Request) {
  const body = await readBody(request);
  return {
    reason: body.reason as GovernanceHashChainFailureReason,
    integrity_state: classifyGovernanceHashChainFailure(body.reason as GovernanceHashChainFailureReason),
  };
}

export async function lineageGovernanceHashChainRequest(request: Request) {
  return executionFromBody(await readBody(request)).lineage_graph;
}

export async function replayGovernanceHashChainRequest(request: Request) {
  return executionFromBody(await readBody(request)).replay_chain;
}

export async function ledgerGovernanceHashChainRequest(request: Request) {
  return executionFromBody(await readBody(request)).ledger_entries;
}

export async function inspectGovernanceHashChainRequest(request?: Request) {
  if (!request) return buildGovernanceHashChainObservabilitySurface();
  return buildGovernanceHashChainObservabilitySurface(inputFromBody(await readBody(request)));
}
