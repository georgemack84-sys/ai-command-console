import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  establishAdaptiveSimulationContract,
  getAdaptiveSimulationContractFoundation,
  replayAdaptiveSimulationContract,
} from "@/services/adaptive-simulation-contract";
import type { AdaptiveSimulationContractInput, AdaptiveSimulationContractResult } from "@/types/adaptive-simulation-contract";

export async function requireAdaptiveSimulationContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptiveSimulationContractFoundation();
}

export async function establishRequest(request: Request) {
  const body = await readBody(request) as AdaptiveSimulationContractInput;
  return establishAdaptiveSimulationContract(body);
}

export async function lifecycleRequest(request: Request) {
  const body = await readBody(request) as AdaptiveSimulationContractInput;
  return establishAdaptiveSimulationContract(body).lifecycle;
}

export async function boundariesRequest(request: Request) {
  const body = await readBody(request) as AdaptiveSimulationContractInput;
  return establishAdaptiveSimulationContract(body).boundaries;
}

export async function ioRequest(request: Request) {
  const body = await readBody(request) as AdaptiveSimulationContractInput;
  const result = establishAdaptiveSimulationContract(body);
  return {
    input_contract: result.input_contract,
    output_contract: result.output_contract,
  };
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as AdaptiveSimulationContractInput;
  return establishAdaptiveSimulationContract(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<AdaptiveSimulationContractResult> & AdaptiveSimulationContractInput;
  const result = body.lifecycle && body.metrics ? body as AdaptiveSimulationContractResult : establishAdaptiveSimulationContract(body);
  return {
    replay_valid: replayAdaptiveSimulationContract(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    contract_status: result.contract_status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptiveSimulationContractFoundation();
  const body = await readBody(request) as AdaptiveSimulationContractInput;
  const result = establishAdaptiveSimulationContract(body);
  return {
    contract_status: result.contract_status,
    failures: result.failures,
    lifecycle_states: result.lifecycle.length,
    simulation_scopes: result.supported_scopes.length,
    replayable: result.replayable,
    deterministic: result.deterministic,
    explainable: result.explainable,
    tenant_isolated: result.tenant_isolated,
    governance_preserved: result.governance_preserved,
    constitutional_governance_preserved: result.constitutional_governance_preserved,
    operator_authority_preserved: result.operator_authority_preserved,
    advisory_only: result.advisory_only,
    authorizes_implementation: result.authorizes_implementation,
    modifies_production_behavior: result.modifies_production_behavior,
  };
}
