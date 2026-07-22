import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getStrategyEvolutionContractFoundation,
  replayStrategyEvolutionContract,
  validateStrategyEvolutionContract,
} from "@/services/strategy-evolution-contract";
import type { StrategyEvolutionContractInput, StrategyEvolutionContractResult } from "@/types/strategy-evolution-contract";

export async function requireStrategyEvolutionContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getStrategyEvolutionContractFoundation();
}

export async function validateRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionContractInput;
  return validateStrategyEvolutionContract(body);
}

export async function domainsRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionContractInput;
  const result = validateStrategyEvolutionContract(body);
  return {
    strategy_domains: result.contract.strategy_domains,
    prohibited_domains: result.contract.prohibited_domains,
    domains_registered: result.validation.domains_registered,
  };
}

export async function authorityRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionContractInput;
  const result = validateStrategyEvolutionContract(body);
  return {
    operator_requirements: result.contract.operator_requirements,
    operator_authority: result.contract.operator_authority,
    operator_approval_required: result.validation.operator_approval_required,
    self_approval_supported: result.api_surface.self_approval_supported,
  };
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionContractInput;
  const result = validateStrategyEvolutionContract(body);
  return {
    governance_requirements: result.contract.governance_requirements,
    governance_supremacy: result.contract.governance_supremacy,
    governance_requirements_complete: result.validation.governance_requirements_complete,
  };
}

export async function simulationRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionContractInput;
  const result = validateStrategyEvolutionContract(body);
  return {
    simulation_requirements: result.contract.simulation_requirements,
    simulation_required: result.simulation_required,
    simulation_requirements_complete: result.validation.simulation_requirements_complete,
  };
}

export async function certificationRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionContractInput;
  const result = validateStrategyEvolutionContract(body);
  return {
    certification_requirements: result.contract.certification_requirements,
    certification_required: result.certification_required,
    certification_requirements_complete: result.validation.certification_requirements_complete,
  };
}

export async function rollbackRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionContractInput;
  const result = validateStrategyEvolutionContract(body);
  return {
    rollback_requirements: result.contract.rollback_requirements,
    rollback_required: result.rollback_required,
    rollback_requirements_complete: result.validation.rollback_requirements_complete,
  };
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<StrategyEvolutionContractResult> & StrategyEvolutionContractInput;
  const result = body.contract ? body as StrategyEvolutionContractResult : validateStrategyEvolutionContract(body);
  return {
    replay_valid: replayStrategyEvolutionContract(result),
    replay_requirements: result.contract.replay_requirements,
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getStrategyEvolutionContractFoundation();
  const body = await readBody(request) as StrategyEvolutionContractInput;
  const result = validateStrategyEvolutionContract(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    strategy_domains: result.contract.strategy_domains.length,
    prohibited_domains: result.contract.prohibited_domains.length,
    advisory_only: result.advisory_only,
    autonomous_strategy_mutation: result.autonomous_strategy_mutation,
  };
}
