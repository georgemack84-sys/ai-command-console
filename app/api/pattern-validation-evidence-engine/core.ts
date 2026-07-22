import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  computePatternValidationRecordHash,
  getPatternValidationEvidenceFoundation,
  replayPatternEvidenceValidation,
  validatePatternEvidence,
} from "@/services/pattern-validation-evidence-engine";
import type { PatternValidationEvidenceResult, PatternValidationInput } from "@/types/pattern-validation-evidence-engine";

export async function requirePatternValidationEvidenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getPatternValidationEvidenceContractResponse() {
  return getPatternValidationEvidenceFoundation();
}

export async function validatePatternEvidenceRequest(request: Request) {
  const body = await readBody(request) as PatternValidationInput;
  return validatePatternEvidence(body);
}

export async function evidencePatternValidationRequest(request: Request) {
  const body = await readBody(request) as PatternValidationInput;
  return validatePatternEvidence(body).validation_records.map((record) => record.evidence_validation_result);
}

export async function supportPatternValidationRequest(request: Request) {
  const body = await readBody(request) as PatternValidationInput;
  return validatePatternEvidence(body).validation_records.map((record) => record.support_validation_result);
}

export async function recurrencePatternValidationRequest(request: Request) {
  const body = await readBody(request) as PatternValidationInput;
  return validatePatternEvidence(body).validation_records.map((record) => record.recurrence_validation_result);
}

export async function registryPatternValidationRequest(request: Request) {
  const body = await readBody(request) as PatternValidationInput;
  return validatePatternEvidence(body).registry;
}

export async function replayPatternValidationRequest(request: Request) {
  const body = await readBody(request) as Partial<PatternValidationEvidenceResult> & PatternValidationInput;
  const result = body.registry ? body as PatternValidationEvidenceResult : validatePatternEvidence(body);
  return {
    replay_valid: replayPatternEvidenceValidation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function inspectPatternValidationRequest(request?: Request) {
  if (!request) return getPatternValidationEvidenceFoundation();
  const body = await readBody(request) as PatternValidationInput;
  const result = validatePatternEvidence(body);
  return {
    state: result.validation.state,
    valid: result.validation.valid,
    failures: result.validation.failures,
    records: result.validation_records.length,
    record_hashes: result.validation_records.map((record) => computePatternValidationRecordHash(record)),
    advisory_only: result.advisory_only,
    adaptive_behavior: result.adaptive_behavior,
  };
}
