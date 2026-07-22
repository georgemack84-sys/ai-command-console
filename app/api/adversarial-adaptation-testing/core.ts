import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getAdversarialTestingFoundation,
  replayAdversarialAdaptationTesting,
  runAdversarialAdaptationTests,
} from "@/services/adversarial-adaptation-testing";
import type { AdversarialTestingInput, AdversarialTestingResult } from "@/types/adversarial-adaptation-testing";

export async function requireAdversarialTestingUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdversarialTestingFoundation();
}

export async function runRequest(request: Request) {
  const body = await readBody(request) as AdversarialTestingInput;
  return runAdversarialAdaptationTests(body);
}

export async function scenarioRequest(request: Request) {
  const body = await readBody(request) as AdversarialTestingInput;
  return runAdversarialAdaptationTests(body).scenario_record;
}

export async function simulationRequest(request: Request) {
  const body = await readBody(request) as AdversarialTestingInput;
  return runAdversarialAdaptationTests(body).simulation_report;
}

export async function validationRequest(request: Request) {
  const body = await readBody(request) as AdversarialTestingInput;
  return runAdversarialAdaptationTests(body).defensive_validation_report;
}

export async function attackSuccessRequest(request: Request) {
  const body = await readBody(request) as AdversarialTestingInput;
  return runAdversarialAdaptationTests(body).attack_success_analysis;
}

export async function coverageRequest(request: Request) {
  const body = await readBody(request) as AdversarialTestingInput;
  return runAdversarialAdaptationTests(body).defensive_coverage_report;
}

export async function resilienceScoreRequest(request: Request) {
  const body = await readBody(request) as AdversarialTestingInput;
  return runAdversarialAdaptationTests(body).resilience_score_report;
}

export async function reportRequest(request: Request) {
  const body = await readBody(request) as AdversarialTestingInput;
  return runAdversarialAdaptationTests(body).adversarial_test_report;
}

export async function adversarialReplayRequest(request: Request) {
  const body = await readBody(request) as AdversarialTestingInput;
  return runAdversarialAdaptationTests(body).adversarial_replay;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as AdversarialTestingInput;
  return runAdversarialAdaptationTests(body).adversarial_test_record;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as AdversarialTestingInput;
  return runAdversarialAdaptationTests(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<AdversarialTestingResult> & AdversarialTestingInput;
  const result = body.scenario_record && body.metrics ? body as AdversarialTestingResult : runAdversarialAdaptationTests(body);
  return {
    replay_valid: replayAdversarialAdaptationTesting(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdversarialTestingFoundation();
  const body = await readBody(request) as AdversarialTestingInput;
  const result = runAdversarialAdaptationTests(body);
  return {
    status: result.status,
    failures: result.failures,
    attack_success_score: result.metrics.attack_success_score,
    defensive_coverage_score: result.metrics.defensive_coverage_score,
    governance_resilience_score: result.metrics.governance_resilience_score,
    constitutional_resilience_score: result.metrics.constitutional_resilience_score,
    replay_resilience_score: result.metrics.replay_resilience_score,
    containment_required: result.metrics.containment_required,
    containment_actions: result.adversarial_test_report.containment_actions,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    evidence_backed: result.evidence_backed,
    governance_preserved: result.governance_preserved,
    constitutional_preserved: result.constitutional_preserved,
    operator_authority_preserved: result.operator_authority_preserved,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    mutates_production_behavior: result.mutates_production_behavior,
    authorizes_attack: result.authorizes_attack,
  };
}
