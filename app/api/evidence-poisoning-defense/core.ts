import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  defendEvidenceIntegrity,
  getEvidencePoisoningFoundation,
  replayEvidencePoisoningDefense,
} from "@/services/evidence-poisoning-defense";
import type { EvidencePoisoningInput, EvidencePoisoningResult } from "@/types/evidence-poisoning-defense";

export async function requireEvidencePoisoningUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getEvidencePoisoningFoundation();
}

export async function defendRequest(request: Request) {
  const body = await readBody(request) as EvidencePoisoningInput;
  return defendEvidenceIntegrity(body);
}

export async function baselineRequest(request: Request) {
  const body = await readBody(request) as EvidencePoisoningInput;
  return defendEvidenceIntegrity(body).baseline;
}

export async function provenanceRequest(request: Request) {
  const body = await readBody(request) as EvidencePoisoningInput;
  return defendEvidenceIntegrity(body).provenance_report;
}

export async function consistencyRequest(request: Request) {
  const body = await readBody(request) as EvidencePoisoningInput;
  return defendEvidenceIntegrity(body).consistency_report;
}

export async function syntheticRequest(request: Request) {
  const body = await readBody(request) as EvidencePoisoningInput;
  return defendEvidenceIntegrity(body).synthetic_report;
}

export async function qualityRequest(request: Request) {
  const body = await readBody(request) as EvidencePoisoningInput;
  return defendEvidenceIntegrity(body).quality_report;
}

export async function sourceReliabilityRequest(request: Request) {
  const body = await readBody(request) as EvidencePoisoningInput;
  return defendEvidenceIntegrity(body).source_reliability_report;
}

export async function healthScoreRequest(request: Request) {
  const body = await readBody(request) as EvidencePoisoningInput;
  return defendEvidenceIntegrity(body).health_score_report;
}

export async function assessmentRequest(request: Request) {
  const body = await readBody(request) as EvidencePoisoningInput;
  return defendEvidenceIntegrity(body).poisoning_assessment;
}

export async function sourceImpactRequest(request: Request) {
  const body = await readBody(request) as EvidencePoisoningInput;
  return defendEvidenceIntegrity(body).source_reliability_impact;
}

export async function containmentRequest(request: Request) {
  const body = await readBody(request) as EvidencePoisoningInput;
  return defendEvidenceIntegrity(body).containment_decision;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as EvidencePoisoningInput;
  return defendEvidenceIntegrity(body).poisoning_record;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as EvidencePoisoningInput;
  return defendEvidenceIntegrity(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<EvidencePoisoningResult> & EvidencePoisoningInput;
  const result = body.baseline && body.metrics ? body as EvidencePoisoningResult : defendEvidenceIntegrity(body);
  return {
    replay_valid: replayEvidencePoisoningDefense(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getEvidencePoisoningFoundation();
  const body = await readBody(request) as EvidencePoisoningInput;
  const result = defendEvidenceIntegrity(body);
  return {
    status: result.status,
    failures: result.failures,
    evidence_health_score: result.metrics.evidence_health_score,
    source_reliability_score: result.metrics.source_reliability_score,
    containment_required: result.metrics.containment_required,
    containment_actions: result.containment_decision.containment_actions,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    evidence_backed: result.evidence_backed,
    governance_preserved: result.governance_preserved,
    constitutional_preserved: result.constitutional_preserved,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    mutates_production_behavior: result.mutates_production_behavior,
    authorizes_learning: result.authorizes_learning,
  };
}
