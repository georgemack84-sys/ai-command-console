import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getAdaptationProposalContractFoundation,
  replayAdaptationProposalContract,
  validateAdaptationProposalContract,
} from "@/services/adaptation-proposal-contract";
import type { AdaptationProposalContractInput, AdaptationProposalContractResult } from "@/types/adaptation-proposal-contract";

export async function requireAdaptationProposalContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptationProposalContractFoundation();
}

export function schemaResponse() {
  const foundation = getAdaptationProposalContractFoundation();
  return {
    adaptation_proposal_contract_version: foundation.adaptation_proposal_contract_version,
    schema_fields: foundation.schema_fields,
    legal_lifecycle_states: foundation.legal_lifecycle_states,
  };
}

export async function validateRequest(request: Request) {
  const body = await readBody(request) as AdaptationProposalContractInput;
  return validateAdaptationProposalContract(body);
}

export async function proposalRequest(request: Request) {
  const body = await readBody(request) as AdaptationProposalContractInput;
  return validateAdaptationProposalContract(body).proposal;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<AdaptationProposalContractResult> & AdaptationProposalContractInput;
  const result = body.proposal && body.validation_report ? body as AdaptationProposalContractResult : validateAdaptationProposalContract(body);
  return {
    replay_valid: replayAdaptationProposalContract(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    validation_state: result.validation_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptationProposalContractFoundation();
  const body = await readBody(request) as AdaptationProposalContractInput;
  const result = validateAdaptationProposalContract(body);
  return {
    validation_state: result.validation_state,
    certified: result.validation_report.certified,
    failures: result.failures,
    proposal_id: result.proposal.proposal_id,
    adaptation_type: result.proposal.adaptation_type,
    replayable: result.replayable,
    evidence_backed: result.evidence_backed,
    governance_enforced: result.governance_enforced,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
  };
}
