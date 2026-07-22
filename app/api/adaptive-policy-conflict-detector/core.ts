import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  detectAdaptivePolicyConflicts,
  getAdaptivePolicyConflictDetectorFoundation,
  replayAdaptivePolicyConflictDetection,
} from "@/services/adaptive-policy-conflict-detector";
import type { AdaptivePolicyConflictDetectorInput, AdaptivePolicyConflictDetectorResult } from "@/types/adaptive-policy-conflict-detector";

export async function requireAdaptivePolicyConflictDetectorUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptivePolicyConflictDetectorFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as AdaptivePolicyConflictDetectorInput;
  return detectAdaptivePolicyConflicts(body);
}

export async function policiesRequest(request: Request) {
  const body = await readBody(request) as AdaptivePolicyConflictDetectorInput;
  return detectAdaptivePolicyConflicts(body).analysis.evaluated_policies;
}

export async function conflictsRequest(request: Request) {
  const body = await readBody(request) as AdaptivePolicyConflictDetectorInput;
  return detectAdaptivePolicyConflicts(body).analysis.detected_conflicts;
}

export async function severityRequest(request: Request) {
  const body = await readBody(request) as AdaptivePolicyConflictDetectorInput;
  const analysis = detectAdaptivePolicyConflicts(body).analysis;
  return {
    severity_levels: analysis.severity_levels,
    constitutional_impact: analysis.constitutional_impact,
    governance_impact: analysis.governance_impact,
    authority_impact: analysis.authority_impact,
    certification_impact: analysis.certification_impact,
    replay_impact: analysis.replay_impact,
    audit_impact: analysis.audit_impact,
    evidence_impact: analysis.evidence_impact,
    rollback_impact: analysis.rollback_impact,
    compliance_impact: analysis.compliance_impact,
  };
}

export async function resolutionRequest(request: Request) {
  const body = await readBody(request) as AdaptivePolicyConflictDetectorInput;
  return detectAdaptivePolicyConflicts(body).analysis.resolution_path;
}

export async function reviewersRequest(request: Request) {
  const body = await readBody(request) as AdaptivePolicyConflictDetectorInput;
  return detectAdaptivePolicyConflicts(body).analysis.required_reviewers;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as AdaptivePolicyConflictDetectorInput;
  return detectAdaptivePolicyConflicts(body).ledger_entry;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<AdaptivePolicyConflictDetectorResult> & AdaptivePolicyConflictDetectorInput;
  const result = body.analysis && body.ledger_entry ? body as AdaptivePolicyConflictDetectorResult : detectAdaptivePolicyConflicts(body);
  return {
    replay_valid: replayAdaptivePolicyConflictDetection(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_reference: result.analysis.replay_reference,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptivePolicyConflictDetectorFoundation();
  const body = await readBody(request) as AdaptivePolicyConflictDetectorInput;
  const result = detectAdaptivePolicyConflicts(body);
  return {
    status: result.analysis.conflict_status,
    conflicts: result.analysis.detected_conflicts.length,
    failures: result.analysis.failures,
    required_reviewers: result.analysis.required_reviewers.map((reviewer) => reviewer.reviewer_role),
    fail_closed: result.fail_closed,
    advisory_only: result.advisory_only,
    conflict_transparent: result.conflict_transparent,
  };
}
