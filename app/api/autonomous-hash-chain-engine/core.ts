import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  appendAutonomousHashChainNode,
  buildAutonomousHashChain,
  buildAutonomousHashChainObservabilitySurface,
  canonicalizeAutonomousHashArtifact,
  classifyAutonomousHashChainFailure,
  getAutonomousHashChainContract,
  validateAutonomousHashChain,
} from "@/services/autonomous-hash-chain-engine";
import type { IntegrityRecord } from "@/types/integrity-contract";
import type { AutonomousHashChainArtifactType, AutonomousHashChainExecution, AutonomousHashChainFailureReason, AutonomousHashChainScenario } from "@/types/autonomous-hash-chain-engine";

export async function requireAutonomousHashChainUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>) {
  return {
    scenario: body.scenario as AutonomousHashChainScenario | undefined,
    integrityRecord: body.integrityRecord as IntegrityRecord | undefined,
    execution: body.execution as AutonomousHashChainExecution | undefined,
  };
}

export function getAutonomousHashChainResponse() { return getAutonomousHashChainContract(); }
export async function buildAutonomousHashChainRequest(request: Request) { return buildAutonomousHashChain(inputFromBody(await readBody(request))); }
export async function validateAutonomousHashChainRequest(request: Request) { return validateAutonomousHashChain(inputFromBody(await readBody(request))); }
export async function inspectAutonomousHashChainRequest(request?: Request) {
  if (!request) return buildAutonomousHashChainObservabilitySurface();
  return buildAutonomousHashChainObservabilitySurface(inputFromBody(await readBody(request)));
}
export async function hashAutonomousArtifactRequest(request: Request) {
  const body = await readBody(request);
  return canonicalizeAutonomousHashArtifact(body.payload ?? body);
}
export async function classifyAutonomousHashChainRequest(request: Request) {
  const body = await readBody(request);
  return { reason: body.reason as AutonomousHashChainFailureReason, state: classifyAutonomousHashChainFailure(body.reason as AutonomousHashChainFailureReason) };
}
export async function appendAutonomousHashChainRequest(request: Request) {
  const body = await readBody(request);
  const execution = buildAutonomousHashChain(inputFromBody(body));
  return appendAutonomousHashChainNode(
    execution,
    (body.artifact_type as AutonomousHashChainArtifactType | undefined) ?? "CERTIFICATION_RECORD",
    (body.artifact_id as string | undefined) ?? `${execution.chain_id}:append:${execution.nodes.length}`,
  );
}
