import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeRiskAdaptationFoundation,
  getRiskAdaptationFoundation,
  replayRiskAdaptationFoundation,
} from "@/services/risk-adaptation-engine-foundation";
import type { RiskAdaptationFoundationResult, RiskAdaptationInput } from "@/types/risk-adaptation-engine-foundation";

export async function requireRiskAdaptationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getRiskAdaptationFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationInput;
  return analyzeRiskAdaptationFoundation(body);
}

export async function lifecycleRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationInput;
  return analyzeRiskAdaptationFoundation(body).lifecycle;
}

export async function pipelineRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationInput;
  return analyzeRiskAdaptationFoundation(body).pipeline;
}

export async function validationRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationInput;
  return analyzeRiskAdaptationFoundation(body).validation;
}

export async function stateMachineRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationInput;
  const result = analyzeRiskAdaptationFoundation(body);
  return {
    current_state: result.lifecycle.current_state,
    allowed_transitions: result.lifecycle.allowed_transitions,
    no_backward_transitions: result.lifecycle.no_backward_transitions,
    rejected_terminal: result.lifecycle.rejected_terminal,
  };
}

export async function replayFrameworkRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationInput;
  return analyzeRiskAdaptationFoundation(body).replay_framework;
}

export async function recommendationsRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationInput;
  const result = analyzeRiskAdaptationFoundation(body);
  return {
    recommendation_id: result.contract.recommendation_id,
    recommendation_type: result.contract.recommendation_type,
    recommended_adjustment: result.contract.recommended_adjustment,
    risk_gap_summary: result.contract.risk_gap_summary,
  };
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationInput;
  const result = analyzeRiskAdaptationFoundation(body);
  return {
    governance_status: result.contract.governance_status,
    constitutional_refs: result.contract.constitutional_refs,
    authority_refs: result.contract.authority_refs,
    governance_visible: result.governance_visible,
  };
}

export async function observabilityRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationInput;
  const result = analyzeRiskAdaptationFoundation(body);
  return {
    lifecycle_status: result.lifecycle.current_state,
    validation_state: result.validation.state,
    governance_status: result.contract.governance_status,
    simulation_status: result.contract.simulation_status,
    operator_status: result.contract.operator_status,
    replay_available: result.validation.replay_complete,
    evidence_complete: result.validation.evidence_complete,
    integrity_verified: result.validation.integrity_verified,
  };
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<RiskAdaptationFoundationResult> & RiskAdaptationInput;
  const result = body.contract ? body as RiskAdaptationFoundationResult : analyzeRiskAdaptationFoundation(body);
  return {
    replay_valid: replayRiskAdaptationFoundation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.contract.replay_refs,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getRiskAdaptationFoundation();
  const body = await readBody(request) as RiskAdaptationInput;
  const result = analyzeRiskAdaptationFoundation(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    recommendation_type: result.contract.recommendation_type,
    current_state: result.lifecycle.current_state,
    advisory_only: result.advisory_only,
    production_mutation_supported: result.production_mutation_supported,
    automatic_risk_update_supported: result.automatic_risk_update_supported,
  };
}
