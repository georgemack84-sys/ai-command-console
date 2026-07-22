import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeGovernanceEscalationPatterns,
  computeGovernancePatternHash,
  getGovernanceEscalationPatternFoundation,
  replayGovernanceEscalationPatterns,
} from "@/services/governance-escalation-pattern-intelligence";
import type { GovernanceEscalationInput, GovernanceEscalationResult } from "@/types/governance-escalation-pattern-intelligence";

export async function requireGovernanceEscalationPatternUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getGovernanceEscalationPatternContractResponse() {
  return getGovernanceEscalationPatternFoundation();
}

export async function analyzeGovernanceEscalationPatternRequest(request: Request) {
  const body = await readBody(request) as GovernanceEscalationInput;
  return analyzeGovernanceEscalationPatterns(body);
}

export async function governanceFindingsRequest(request: Request) {
  const body = await readBody(request) as GovernanceEscalationInput;
  return analyzeGovernanceEscalationPatterns(body).governance_pattern_records.map((record) => ({
    governance_pattern_id: record.governance_pattern_id,
    pattern_id: record.pattern_id,
    governance_pattern_type: record.governance_pattern_type,
    governance_severity: record.governance_severity,
    governance_summary: record.governance_summary,
    supporting_governance_refs: record.supporting_governance_refs,
  }));
}

export async function constitutionalFindingsRequest(request: Request) {
  const body = await readBody(request) as GovernanceEscalationInput;
  return analyzeGovernanceEscalationPatterns(body).governance_pattern_records.map((record) => ({
    governance_pattern_id: record.governance_pattern_id,
    constitutional_relevance: record.constitutional_relevance,
    constitutional_review_recommended: record.escalation_level === "LEVEL_4_CONSTITUTIONAL",
    explanation: record.explanation,
  }));
}

export async function authorityFindingsRequest(request: Request) {
  const body = await readBody(request) as GovernanceEscalationInput;
  return analyzeGovernanceEscalationPatterns(body).governance_pattern_records.map((record) => ({
    governance_pattern_id: record.governance_pattern_id,
    authority_relevance: record.authority_relevance,
    supporting_authority_refs: record.supporting_authority_refs,
    modifies_authority: record.modifies_authority,
  }));
}

export async function certificationFindingsRequest(request: Request) {
  const body = await readBody(request) as GovernanceEscalationInput;
  return analyzeGovernanceEscalationPatterns(body).governance_pattern_records.map((record) => ({
    governance_pattern_id: record.governance_pattern_id,
    certification_relevance: record.certification_relevance,
    supporting_certification_refs: record.supporting_certification_refs,
    modifies_certification: record.modifies_certification,
  }));
}

export async function escalationRecommendationsRequest(request: Request) {
  const body = await readBody(request) as GovernanceEscalationInput;
  return analyzeGovernanceEscalationPatterns(body).governance_pattern_records.map((record) => ({
    governance_pattern_id: record.governance_pattern_id,
    escalation_required: record.escalation_required,
    escalation_level: record.escalation_level,
    recommended_governance_action: record.recommended_governance_action,
    governance_pattern_hash: computeGovernancePatternHash(record),
  }));
}

export async function governanceRegistryRequest(request: Request) {
  const body = await readBody(request) as GovernanceEscalationInput;
  return analyzeGovernanceEscalationPatterns(body).registry;
}

export async function replayGovernanceEscalationPatternRequest(request: Request) {
  const body = await readBody(request) as Partial<GovernanceEscalationResult> & GovernanceEscalationInput;
  const result = body.registry ? body as GovernanceEscalationResult : analyzeGovernanceEscalationPatterns(body);
  return {
    replay_valid: replayGovernanceEscalationPatterns(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function inspectGovernanceEscalationPatternRequest(request?: Request) {
  if (!request) return getGovernanceEscalationPatternFoundation();
  const body = await readBody(request) as GovernanceEscalationInput;
  const result = analyzeGovernanceEscalationPatterns(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    governance_pattern_records: result.governance_pattern_records.length,
    advisory_only: result.advisory_only,
    automatic_enforcement: result.automatic_enforcement,
    modifies_authority: result.modifies_authority,
    modifies_policy: result.modifies_policy,
  };
}
