import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  establishMemoryQualificationValidation,
  getMemoryQualificationValidation,
  replayMemoryQualificationValidation,
} from "@/services/memory-qualification-validation";
import type { MemoryQualificationInput, MemoryQualificationResult } from "@/types/memory-qualification-validation";

export async function requireMemoryQualificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getMemoryQualificationValidation();
}

export async function establishRequest(request: Request) {
  const body = (await readBody(request)) as MemoryQualificationInput;
  return establishMemoryQualificationValidation(body);
}

export async function recordsRequest(request: Request) {
  const body = (await readBody(request)) as MemoryQualificationInput;
  return establishMemoryQualificationValidation(body).qualification_records;
}

export async function validationRequest(request: Request, key: "evidence_validation" | "replay_validation" | "governance_validation" | "confidence_validation" | "certification_validation") {
  const body = (await readBody(request)) as MemoryQualificationInput;
  return establishMemoryQualificationValidation(body).qualification_records.map((record) => record[key]);
}

export async function ledgerRequest(request: Request) {
  const body = (await readBody(request)) as MemoryQualificationInput;
  return establishMemoryQualificationValidation(body).qualification_ledger;
}

export async function metricsRequest(request: Request) {
  const body = (await readBody(request)) as MemoryQualificationInput;
  return establishMemoryQualificationValidation(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = (await readBody(request)) as Partial<MemoryQualificationResult> & MemoryQualificationInput;
  const result = body.contract && body.metrics ? (body as MemoryQualificationResult) : establishMemoryQualificationValidation(body);
  return {
    replay_valid: replayMemoryQualificationValidation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getMemoryQualificationValidation();
  const body = (await readBody(request)) as MemoryQualificationInput;
  const result = establishMemoryQualificationValidation(body);
  return {
    status: result.status,
    failures: result.failures,
    qualification_requests: result.metrics.qualification_requests,
    qualification_success_rate: result.metrics.qualification_success_rate,
    qualification_failures: result.metrics.qualification_failures,
    deterministic: result.deterministic,
    replayable: result.replayable,
    governed: result.governed,
    tenant_isolated: result.tenant_isolated,
    evidence_lineage_preserved: result.evidence_lineage_preserved,
    qualified_memory_approved: result.qualified_memory_approved,
    invalid_memory_rejected: result.invalid_memory_rejected,
    advisory_only: result.advisory_only,
  };
}
