import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  computeDetectedPatternHash,
  detectPatterns,
  getPatternDetectionFoundation,
  replayPatternDetection,
} from "@/services/pattern-detection-engine";
import type { PatternDetectionInput, PatternDetectionResult } from "@/types/pattern-detection-engine";

export async function requirePatternDetectionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getPatternDetectionContractResponse() {
  return getPatternDetectionFoundation();
}

export async function detectPatternRequest(request: Request) {
  const body = await readBody(request) as PatternDetectionInput;
  return detectPatterns(body);
}

export async function rulesPatternDetectionRequest(request: Request) {
  const body = await readBody(request) as PatternDetectionInput;
  return detectPatterns(body).rules;
}

export async function classifyPatternDetectionRequest(request: Request) {
  const body = await readBody(request) as PatternDetectionInput;
  return detectPatterns(body).detected_patterns.map((pattern) => ({
    pattern_id: pattern.pattern_id,
    pattern_type: pattern.pattern_type,
    pattern_classification: pattern.pattern_classification,
    governance_relevance: pattern.governance_relevance,
    strategic_relevance: pattern.strategic_relevance,
  }));
}

export async function registryPatternDetectionRequest(request: Request) {
  const body = await readBody(request) as PatternDetectionInput;
  return detectPatterns(body).registry;
}

export async function identityPatternDetectionRequest(request: Request) {
  const body = await readBody(request) as PatternDetectionInput;
  const result = detectPatterns(body);
  return result.detected_patterns.map((pattern) => ({
    pattern_id: pattern.pattern_id,
    identity_hash: computeDetectedPatternHash(pattern),
    immutable: pattern.immutable,
  }));
}

export async function replayPatternDetectionRequest(request: Request) {
  const body = await readBody(request) as Partial<PatternDetectionResult> & PatternDetectionInput;
  const result = body.registry ? body as PatternDetectionResult : detectPatterns(body);
  return {
    replay_valid: replayPatternDetection(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function inspectPatternDetectionRequest(request?: Request) {
  if (!request) return getPatternDetectionFoundation();
  const body = await readBody(request) as PatternDetectionInput;
  const result = detectPatterns(body);
  return {
    state: result.validation.state,
    valid: result.validation.valid,
    failures: result.validation.failures,
    detected_patterns: result.detected_patterns.length,
    advisory_only: result.advisory_only,
    predicts_future_behavior: result.predicts_future_behavior,
  };
}
