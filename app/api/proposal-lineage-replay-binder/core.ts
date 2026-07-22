import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  bindProposalLineage,
  getProposalLineageReplayFoundation,
  replayProposalLineageBinding,
} from "@/services/proposal-lineage-replay-binder";
import type { ProposalLineageReplayInput, ProposalLineageReplayResult } from "@/types/proposal-lineage-replay-binder";

export async function requireProposalLineageReplayUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getProposalLineageReplayFoundation();
}

export async function bindRequest(request: Request) {
  const body = await readBody(request) as ProposalLineageReplayInput;
  return bindProposalLineage(body);
}

export async function recordsRequest(request: Request) {
  const body = await readBody(request) as ProposalLineageReplayInput;
  return bindProposalLineage(body).lineage_records;
}

export async function replayGraphsRequest(request: Request) {
  const body = await readBody(request) as ProposalLineageReplayInput;
  return bindProposalLineage(body).lineage_records.map((record) => record.replay_graph);
}

export async function dependencyGraphsRequest(request: Request) {
  const body = await readBody(request) as ProposalLineageReplayInput;
  return bindProposalLineage(body).lineage_records.map((record) => record.dependency_graph);
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as ProposalLineageReplayInput;
  return bindProposalLineage(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<ProposalLineageReplayResult> & ProposalLineageReplayInput;
  const result = body.lineage_records && body.metrics ? body as ProposalLineageReplayResult : bindProposalLineage(body);
  return {
    replay_valid: replayProposalLineageBinding(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    binding_state: result.binding_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getProposalLineageReplayFoundation();
  const body = await readBody(request) as ProposalLineageReplayInput;
  const result = bindProposalLineage(body);
  return {
    binding_state: result.binding_state,
    failures: result.failures,
    lineage_records: result.lineage_records.length,
    historical_artifacts_referenced: result.metrics.historical_artifacts_referenced,
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    lineage_immutable: result.lineage_immutable,
    backward_traceability_complete: result.backward_traceability_complete,
    forward_traceability_complete: result.forward_traceability_complete,
    advisory_only: result.advisory_only,
    modifies_proposals: result.modifies_proposals,
    approves_proposals: result.approves_proposals,
  };
}
