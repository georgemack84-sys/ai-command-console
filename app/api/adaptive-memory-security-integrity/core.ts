import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  establishAdaptiveMemorySecurityIntegrity,
  getAdaptiveMemorySecurityIntegrity,
  replayAdaptiveMemorySecurityIntegrity,
} from "@/services/adaptive-memory-security-integrity";
import type { AdaptiveMemorySecurityInput, AdaptiveMemorySecurityResult, MemorySecurityRecord } from "@/types/adaptive-memory-security-integrity";

export async function requireAdaptiveMemorySecurityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptiveMemorySecurityIntegrity();
}

export async function establishRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemorySecurityInput;
  return establishAdaptiveMemorySecurityIntegrity(body);
}

export async function recordsRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemorySecurityInput;
  return establishAdaptiveMemorySecurityIntegrity(body).security_records;
}

export async function validationRequest(
  request: Request,
  key: "integrity_validation" | "tamper_detection" | "authorization_status" | "encryption_status",
) {
  const body = (await readBody(request)) as AdaptiveMemorySecurityInput;
  return establishAdaptiveMemorySecurityIntegrity(body).security_records.map((record: MemorySecurityRecord) => ({
    security_event_id: record.security_event_id,
    memory_id: record.memory_id,
    validation: record[key],
  }));
}

export async function sectionRequest(request: Request, key: "alerts" | "security_ledger" | "metrics") {
  const body = (await readBody(request)) as AdaptiveMemorySecurityInput;
  return establishAdaptiveMemorySecurityIntegrity(body)[key];
}

export async function replayRequest(request: Request) {
  const body = (await readBody(request)) as Partial<AdaptiveMemorySecurityResult> & AdaptiveMemorySecurityInput;
  const result = body.contract && body.metrics ? (body as AdaptiveMemorySecurityResult) : establishAdaptiveMemorySecurityIntegrity(body);
  return {
    replay_valid: replayAdaptiveMemorySecurityIntegrity(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptiveMemorySecurityIntegrity();
  const body = (await readBody(request)) as AdaptiveMemorySecurityInput;
  const result = establishAdaptiveMemorySecurityIntegrity(body);
  return {
    status: result.status,
    failures: result.failures,
    blocked_operations: result.metrics.blocked_operations,
    alert_count: result.alerts.length,
    deterministic: result.deterministic,
    replayable: result.replayable,
    integrity_verified: result.integrity_verified,
    tamper_evident: result.tamper_evident,
    encryption_enforced: result.encryption_enforced,
    access_verified: result.access_verified,
    tenant_isolation_preserved: result.tenant_isolation_preserved,
    governance_enforced: result.governance_enforced,
    poisoning_prevented: result.poisoning_prevented,
  };
}
