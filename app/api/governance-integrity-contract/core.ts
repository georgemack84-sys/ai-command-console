import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceIntegrityContract,
  buildGovernanceIntegrityObservabilitySurface,
  classifyGovernanceIntegrityFailure,
  computeGovernanceIntegrityCanonicalHash,
  computeGovernanceIntegrityContentHash,
  computeGovernanceIntegrityRecordHash,
  getGovernanceIntegrityContract,
  transitionGovernanceIntegrityLifecycle,
  validateGovernanceIntegrityContract,
} from "@/services/governance-integrity-contract";
import type {
  GovernanceIntegrityContract,
  GovernanceIntegrityEngineInput,
  GovernanceIntegrityFailureReason,
  GovernanceIntegrityLifecycleState,
} from "@/types/governance-integrity-contract";

export async function requireGovernanceIntegrityContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): GovernanceIntegrityEngineInput {
  return body as GovernanceIntegrityEngineInput;
}

function contractFromBody(body: Record<string, unknown>): GovernanceIntegrityContract {
  return (body.contract as GovernanceIntegrityContract | undefined) ?? buildGovernanceIntegrityContract(inputFromBody(body));
}

export function getGovernanceIntegrityContractResponse() {
  return getGovernanceIntegrityContract();
}

export async function registerGovernanceIntegrityContractRequest(request: Request) {
  return buildGovernanceIntegrityContract(inputFromBody(await readBody(request)));
}

export async function validateGovernanceIntegrityContractRequest(request: Request) {
  const body = await readBody(request);
  return validateGovernanceIntegrityContract(body.contract ? contractFromBody(body) : inputFromBody(body));
}

export async function hashGovernanceIntegrityContractRequest(request: Request) {
  const contract = contractFromBody(await readBody(request));
  return {
    content_hash: computeGovernanceIntegrityContentHash(contract),
    canonical_hash: computeGovernanceIntegrityCanonicalHash(contract),
    record_hash: computeGovernanceIntegrityRecordHash(contract),
  };
}

export async function lifecycleGovernanceIntegrityContractRequest(request: Request) {
  const body = await readBody(request);
  return transitionGovernanceIntegrityLifecycle(
    contractFromBody(body),
    (body.to as GovernanceIntegrityLifecycleState | undefined) ?? "MONITORED",
  );
}

export async function classifyGovernanceIntegrityContractRequest(request: Request) {
  const body = await readBody(request);
  return {
    reason: body.reason as GovernanceIntegrityFailureReason,
    integrity_state: classifyGovernanceIntegrityFailure(body.reason as GovernanceIntegrityFailureReason),
  };
}

export async function inspectGovernanceIntegrityContractRequest(request?: Request) {
  if (!request) return buildGovernanceIntegrityObservabilitySurface();
  return buildGovernanceIntegrityObservabilitySurface(inputFromBody(await readBody(request)));
}
