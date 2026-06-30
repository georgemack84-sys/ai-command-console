import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildPolicyLineageObservabilitySurface,
  buildPolicyTimeline,
  computePolicyLineageReconstructionHash,
  getPolicyLineageContract,
  reconstructPolicyLineage,
  resolvePolicy,
  resolvePolicyDependencies,
  resolvePolicyInheritance,
  resolvePolicySupersession,
  runPolicyLineageReconstruction,
  validatePolicyLineageReconstruction,
  verifyPolicyReplay,
} from "@/services/policy-lineage-reconstruction";
import type { PolicyLineageEngineInput, PolicyLineageReconstruction } from "@/types/policy-lineage-reconstruction";

export async function requirePolicyLineageUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): PolicyLineageEngineInput {
  return body as PolicyLineageEngineInput;
}

export function getPolicyLineageContractResponse() {
  return getPolicyLineageContract();
}

export async function resolvePolicyRequest(request: Request) {
  const body = await readBody(request);
  return resolvePolicy(inputFromBody(body));
}

export async function reconstructPolicyLineageRequest(request: Request) {
  const body = await readBody(request);
  return runPolicyLineageReconstruction(inputFromBody(body));
}

export async function validatePolicyLineageRequest(request: Request) {
  const body = await readBody(request);
  const reconstruction = (body.reconstruction as Partial<PolicyLineageReconstruction> | undefined) ?? reconstructPolicyLineage(inputFromBody(body));
  return validatePolicyLineageReconstruction(reconstruction);
}

export async function replayPolicyLineageRequest(request: Request) {
  const body = await readBody(request);
  const reconstruction = (body.reconstruction as PolicyLineageReconstruction | undefined) ?? reconstructPolicyLineage(inputFromBody(body));
  return verifyPolicyReplay(reconstruction);
}

export async function hashPolicyLineageRequest(request: Request) {
  const body = await readBody(request);
  const reconstruction = (body.reconstruction as PolicyLineageReconstruction | undefined) ?? reconstructPolicyLineage(inputFromBody(body));
  return { policy_lineage_reconstruction_hash: computePolicyLineageReconstructionHash(reconstruction) };
}

export async function dependenciesPolicyLineageRequest(request: Request) {
  const body = await readBody(request);
  return resolvePolicyDependencies((body.reconstruction as PolicyLineageReconstruction | undefined) ?? inputFromBody(body));
}

export async function inheritancePolicyLineageRequest(request: Request) {
  const body = await readBody(request);
  return resolvePolicyInheritance((body.reconstruction as PolicyLineageReconstruction | undefined) ?? inputFromBody(body));
}

export async function supersessionPolicyLineageRequest(request: Request) {
  const body = await readBody(request);
  return resolvePolicySupersession((body.reconstruction as PolicyLineageReconstruction | undefined) ?? inputFromBody(body));
}

export async function timelinePolicyLineageRequest(request: Request) {
  const body = await readBody(request);
  return buildPolicyTimeline((body.reconstruction as PolicyLineageReconstruction | undefined) ?? inputFromBody(body));
}

export async function inspectPolicyLineageRequest(request?: Request) {
  if (!request) return buildPolicyLineageObservabilitySurface();
  const body = await readBody(request);
  return buildPolicyLineageObservabilitySurface(inputFromBody(body));
}
