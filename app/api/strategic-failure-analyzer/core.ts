import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeStrategicFailures,
  getStrategicFailureAnalyzerFoundation,
  replayStrategicFailureAnalysis,
} from "@/services/strategic-failure-analyzer";
import type { StrategicFailureInput, StrategicFailureResult } from "@/types/strategic-failure-analyzer";

export async function requireStrategicFailureUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getStrategicFailureAnalyzerFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as StrategicFailureInput;
  return analyzeStrategicFailures(body);
}

export async function failuresRequest(request: Request) {
  const body = await readBody(request) as StrategicFailureInput;
  return analyzeStrategicFailures(body).failures;
}

export async function classificationRequest(request: Request) {
  const body = await readBody(request) as StrategicFailureInput;
  return analyzeStrategicFailures(body).failures.map((failure) => ({
    failure_id: failure.failure_id,
    failure_category: failure.failure_category,
    severity: failure.severity,
    recurrence_score: failure.recurrence_score,
    remediation_priority: failure.remediation_priority,
  }));
}

export async function rootCauseRequest(request: Request) {
  const body = await readBody(request) as StrategicFailureInput;
  return analyzeStrategicFailures(body).failures.map((failure) => ({
    failure_id: failure.failure_id,
    root_cause_summary: failure.root_cause_summary,
    operational_impact: failure.operational_impact,
    governance_impact: failure.governance_impact,
    constitutional_impact: failure.constitutional_impact,
  }));
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as StrategicFailureInput;
  return analyzeStrategicFailures(body).failures.map((failure) => ({
    failure_id: failure.failure_id,
    supporting_pattern_refs: failure.supporting_pattern_refs,
    supporting_outcome_refs: failure.supporting_outcome_refs,
    supporting_evidence_refs: failure.supporting_evidence_refs,
    supporting_recommendation_refs: failure.supporting_recommendation_refs,
  }));
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as StrategicFailureInput;
  return analyzeStrategicFailures(body).failures.map((failure) => ({
    failure_id: failure.failure_id,
    governance_impact: failure.governance_impact,
    constitutional_impact: failure.constitutional_impact,
    supporting_governance_refs: failure.supporting_governance_refs,
  }));
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<StrategicFailureResult> & StrategicFailureInput;
  const result = body.registry ? body as StrategicFailureResult : analyzeStrategicFailures(body);
  return {
    replay_valid: replayStrategicFailureAnalysis(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    supporting_replay_refs: result.failures.flatMap((failure) => failure.supporting_replay_refs),
  };
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as StrategicFailureInput;
  return analyzeStrategicFailures(body).registry;
}

export async function inspectRequest(request?: Request) {
  if (!request) return getStrategicFailureAnalyzerFoundation();
  const body = await readBody(request) as StrategicFailureInput;
  const result = analyzeStrategicFailures(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    failure_records: result.failures.length,
    evidence_backed: result.evidence_backed,
    governance_compliant: result.governance_compliant,
    advisory_only: result.advisory_only,
    executes_remediation: result.executes_remediation,
  };
}
