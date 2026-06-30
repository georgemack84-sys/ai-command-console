import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildComplianceCategoryRegistry,
  buildComplianceContractDoctrine,
  buildComplianceObservabilitySurface,
  buildComplianceRecord,
  buildComplianceRuleRegistry,
  buildComplianceThresholdRegistry,
  computeComplianceHash,
  replayComplianceRecord,
  transitionComplianceContractLifecycle,
  validateComplianceRecord,
} from "@/services/compliance-contract";
import type { ComplianceContractLifecycleState, ComplianceRecord } from "@/types/compliance-contract";

export async function requireComplianceContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getComplianceContract() {
  return {
    doctrine: buildComplianceContractDoctrine(),
    categories: buildComplianceCategoryRegistry(),
    rules: buildComplianceRuleRegistry(),
    thresholds: buildComplianceThresholdRegistry(),
    record: buildComplianceRecord(),
  };
}

export async function validateComplianceContractRequest(request: Request) {
  const body = await readBody(request);
  return validateComplianceRecord(Object.keys(body).length ? body as Partial<ComplianceRecord> : buildComplianceRecord());
}

export async function hashComplianceContractRequest(request: Request) {
  const body = await readBody(request);
  const record = Object.keys(body).length ? buildComplianceRecord(body as Partial<ComplianceRecord>) : buildComplianceRecord();
  return { compliance_hash: computeComplianceHash(record) };
}

export async function replayComplianceContractRequest(request: Request) {
  const body = await readBody(request);
  return replayComplianceRecord(Object.keys(body).length ? buildComplianceRecord(body as Partial<ComplianceRecord>) : buildComplianceRecord());
}

export async function inspectComplianceContractRequest(request?: Request) {
  if (!request) return buildComplianceObservabilitySurface();
  const body = await readBody(request);
  return buildComplianceObservabilitySurface(Object.keys(body).length ? buildComplianceRecord(body as Partial<ComplianceRecord>) : buildComplianceRecord());
}

export async function transitionComplianceContractRequest(request: Request) {
  const body = await readBody(request) as { from_state?: ComplianceContractLifecycleState; to_state?: ComplianceContractLifecycleState };
  return transitionComplianceContractLifecycle(body.from_state ?? "DRAFT", body.to_state ?? "ACTIVE");
}
