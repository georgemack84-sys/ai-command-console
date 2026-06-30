import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildIntegrityContract,
  buildIntegrityObservabilitySurface,
  classifyIntegrityFailure,
  computeIntegrityArtifactHash,
  computeIntegrityLineageHash,
  computeIntegrityMetadataHash,
  computeIntegrityPayloadHash,
  computeIntegrityRecordHash,
  computeIntegrityReplayHash,
  computeIntegrityVerificationHash,
  getIntegrityContract,
  transitionIntegrityLifecycle,
  validateIntegrityContract,
} from "@/services/integrity-contract";
import type { ReplayCertificationReport } from "@/types/replay-certification-gate";
import type { IntegrityFailureReason, IntegrityLifecycleState, IntegrityRecord, IntegrityScenario } from "@/types/integrity-contract";

export async function requireIntegrityContractUser() {
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
    scenario: body.scenario as IntegrityScenario | undefined,
    replayCertificationReport: body.replayCertificationReport as ReplayCertificationReport | undefined,
    record: body.record as IntegrityRecord | undefined,
  };
}

export function getIntegrityContractResponse() { return getIntegrityContract(); }
export async function registerIntegrityRequest(request: Request) { return buildIntegrityContract(inputFromBody(await readBody(request))); }
export async function validateIntegrityRequest(request: Request) { return validateIntegrityContract(inputFromBody(await readBody(request))); }
export async function hashIntegrityRequest(request: Request) {
  const body = await readBody(request);
  const record = buildIntegrityContract(inputFromBody(body));
  return {
    payload_hash: computeIntegrityPayloadHash(record),
    metadata_hash: computeIntegrityMetadataHash(record),
    replay_hash: computeIntegrityReplayHash(record),
    lineage_hash: computeIntegrityLineageHash(record),
    artifact_hash: computeIntegrityArtifactHash(record),
    verification_hash: computeIntegrityVerificationHash(record),
    record_hash: computeIntegrityRecordHash(record),
  };
}
export async function lifecycleIntegrityRequest(request: Request) {
  const body = await readBody(request);
  return transitionIntegrityLifecycle(buildIntegrityContract(inputFromBody(body)), body.to as IntegrityLifecycleState | undefined);
}
export async function classifyIntegrityRequest(request: Request) {
  const body = await readBody(request);
  return { reason: body.reason as IntegrityFailureReason, state: classifyIntegrityFailure(body.reason as IntegrityFailureReason) };
}
export async function inspectIntegrityRequest(request?: Request) {
  if (!request) return buildIntegrityObservabilitySurface();
  return buildIntegrityObservabilitySurface(inputFromBody(await readBody(request)));
}
