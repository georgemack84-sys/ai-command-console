import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildPatternCandidates,
  computePatternCandidateHash,
  getPatternCandidateBuilderFoundation,
  replayPatternCandidateBuilder,
} from "@/services/pattern-candidate-builder";
import type { PatternCandidateBuilderResult, PatternCandidateInput } from "@/types/pattern-candidate-builder";

export async function requirePatternCandidateBuilderUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getPatternCandidateBuilderContractResponse() {
  return getPatternCandidateBuilderFoundation();
}

export async function buildPatternCandidateRequest(request: Request) {
  const body = await readBody(request) as PatternCandidateInput;
  return buildPatternCandidates(body);
}

export async function aggregatePatternCandidateRequest(request: Request) {
  const body = await readBody(request) as PatternCandidateInput;
  return buildPatternCandidates(body).aggregation;
}

export async function windowsPatternCandidateRequest(request: Request) {
  const body = await readBody(request) as PatternCandidateInput;
  return buildPatternCandidates(body).window;
}

export async function registryPatternCandidateRequest(request: Request) {
  const body = await readBody(request) as PatternCandidateInput;
  return buildPatternCandidates(body).registry;
}

export async function identityPatternCandidateRequest(request: Request) {
  const body = await readBody(request) as PatternCandidateInput;
  const result = buildPatternCandidates(body);
  return result.candidates.map((candidate) => ({
    candidate_id: candidate.candidate_id,
    identity_hash: computePatternCandidateHash(candidate),
    grouping_key: candidate.grouping_key,
    immutable: candidate.immutable,
  }));
}

export async function replayPatternCandidateRequest(request: Request) {
  const body = await readBody(request) as Partial<PatternCandidateBuilderResult> & PatternCandidateInput;
  const result = body.registry ? body as PatternCandidateBuilderResult : buildPatternCandidates(body);
  return {
    replay_valid: replayPatternCandidateBuilder(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function inspectPatternCandidateRequest(request?: Request) {
  if (!request) return getPatternCandidateBuilderFoundation();
  const body = await readBody(request) as PatternCandidateInput;
  const result = buildPatternCandidates(body);
  return {
    state: result.validation.state,
    valid: result.validation.valid,
    failures: result.validation.failures,
    candidates: result.candidates.length,
    registry_id: result.registry.registry_id,
    advisory_only: result.advisory_only,
    validates_pattern_truth: result.validates_pattern_truth,
  };
}
