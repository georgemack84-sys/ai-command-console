import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeEvidenceReliability,
  getEvidenceReliabilityFoundation,
  replayEvidenceReliability,
} from "@/services/evidence-reliability-recalibrator";
import type { EvidenceReliabilityInput, EvidenceReliabilityResult } from "@/types/evidence-reliability-recalibrator";

export async function requireEvidenceReliabilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getEvidenceReliabilityFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as EvidenceReliabilityInput;
  return analyzeEvidenceReliability(body);
}

export async function recordsRequest(request: Request) {
  const body = await readBody(request) as EvidenceReliabilityInput;
  return analyzeEvidenceReliability(body).reliability_records;
}

export async function sourcesRequest(request: Request) {
  const body = await readBody(request) as EvidenceReliabilityInput;
  return analyzeEvidenceReliability(body).source_profiles;
}

export async function reportRequest(request: Request) {
  const body = await readBody(request) as EvidenceReliabilityInput;
  return analyzeEvidenceReliability(body).report;
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as EvidenceReliabilityInput;
  return analyzeEvidenceReliability(body).registry;
}

export async function completenessRequest(request: Request) {
  const body = await readBody(request) as EvidenceReliabilityInput;
  return analyzeEvidenceReliability(body).reliability_records.map((record) => ({
    evidence_reliability_id: record.evidence_reliability_id,
    completeness_rating: record.completeness_rating,
    completeness_score: record.completeness_score,
  }));
}

export async function freshnessRequest(request: Request) {
  const body = await readBody(request) as EvidenceReliabilityInput;
  return analyzeEvidenceReliability(body).reliability_records.map((record) => ({
    evidence_reliability_id: record.evidence_reliability_id,
    freshness_score: record.freshness_score,
    durability_rating: record.durability_rating,
  }));
}

export async function conflictsRequest(request: Request) {
  const body = await readBody(request) as EvidenceReliabilityInput;
  return analyzeEvidenceReliability(body).reliability_records.map((record) => ({
    evidence_reliability_id: record.evidence_reliability_id,
    conflict_severity: record.conflict_severity,
    conflict_score: record.conflict_score,
  }));
}

export async function uncertaintyRequest(request: Request) {
  const body = await readBody(request) as EvidenceReliabilityInput;
  return analyzeEvidenceReliability(body).reliability_records.map((record) => ({
    evidence_reliability_id: record.evidence_reliability_id,
    uncertainty_score: record.uncertainty_score,
    confidence_accuracy_influence: record.confidence_accuracy_influence,
  }));
}

export async function lineageRequest(request: Request) {
  const body = await readBody(request) as EvidenceReliabilityInput;
  return analyzeEvidenceReliability(body).reliability_records.map((record) => ({
    evidence_reliability_id: record.evidence_reliability_id,
    lineage_integrity_score: record.lineage_integrity_score,
    replay_refs: record.replay_refs,
  }));
}

export async function verificationRequest(request: Request) {
  const body = await readBody(request) as EvidenceReliabilityInput;
  const result = analyzeEvidenceReliability(body);
  return {
    records: result.reliability_records.map((record) => ({
      evidence_reliability_id: record.evidence_reliability_id,
      verification_score: record.verification_score,
    })),
    source_profiles: result.source_profiles.map((profile) => ({
      profile_id: profile.profile_id,
      verification_success_rate: profile.verification_success_rate,
    })),
  };
}

export async function durabilityRequest(request: Request) {
  const body = await readBody(request) as EvidenceReliabilityInput;
  return analyzeEvidenceReliability(body).reliability_records.map((record) => ({
    evidence_reliability_id: record.evidence_reliability_id,
    durability_rating: record.durability_rating,
    durability_score: record.durability_score,
  }));
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<EvidenceReliabilityResult> & EvidenceReliabilityInput;
  const result = body.registry ? body as EvidenceReliabilityResult : analyzeEvidenceReliability(body);
  return {
    replay_valid: replayEvidenceReliability(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.reliability_records.flatMap((item) => item.replay_refs),
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getEvidenceReliabilityFoundation();
  const body = await readBody(request) as EvidenceReliabilityInput;
  const result = analyzeEvidenceReliability(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    overall_reliability_score: result.reliability_records[0]?.overall_reliability_score,
    source_category: result.reliability_records[0]?.source_category,
    advisory_only: result.advisory_only,
    updates_evidence_weights: result.updates_evidence_weights,
    updates_confidence_model: result.updates_confidence_model,
    changes_historical_decisions: result.changes_historical_decisions,
  };
}
