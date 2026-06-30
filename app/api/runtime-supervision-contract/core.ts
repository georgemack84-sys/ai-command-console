import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRuntimeSupervisionContract,
  buildRuntimeSupervisionObservabilitySurface,
  computeRuntimeSupervisionIntegrityHash,
  getRuntimeSupervisionContractFramework,
  replayRuntimeSupervisionContract,
  validateRuntimeSupervisionContract,
} from "@/services/runtime-supervision-contract";
import type { ExecutionAssuranceRecord } from "@/types/execution-assurance-contract";
import type { RuntimeSupervisionContract, RuntimeSupervisionScenario } from "@/types/runtime-supervision-contract";

export async function requireRuntimeSupervisionContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function contractFromBody(body: Record<string, unknown>) {
  return (body.contract as RuntimeSupervisionContract | undefined) ?? buildRuntimeSupervisionContract({
    scenario: body.scenario as RuntimeSupervisionScenario | undefined,
    sourceExecutionAssurance: body.sourceExecutionAssurance as ExecutionAssuranceRecord | undefined,
    created_by: body.created_by as string | undefined,
  });
}

export function getRuntimeSupervisionContractResponse() {
  return getRuntimeSupervisionContractFramework();
}

export async function createRuntimeSupervisionContractRequest(request: Request) {
  const body = await readBody(request);
  return contractFromBody(body);
}

export async function validateRuntimeSupervisionContractRequest(request: Request) {
  const body = await readBody(request);
  const contract = contractFromBody(body);
  return validateRuntimeSupervisionContract(contract, { registry: (body.registry as readonly RuntimeSupervisionContract[] | undefined) ?? [contract] });
}

export async function replayRuntimeSupervisionContractRequest(request: Request) {
  const body = await readBody(request);
  return replayRuntimeSupervisionContract(contractFromBody(body));
}

export async function hashRuntimeSupervisionContractRequest(request: Request) {
  const body = await readBody(request);
  return { runtime_supervision_integrity_hash: computeRuntimeSupervisionIntegrityHash(contractFromBody(body)) };
}

export async function inspectRuntimeSupervisionContractRequest(request?: Request) {
  if (!request) return buildRuntimeSupervisionObservabilitySurface();
  const body = await readBody(request);
  return buildRuntimeSupervisionObservabilitySurface(contractFromBody(body));
}
