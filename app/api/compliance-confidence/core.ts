import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildComplianceConfidenceContract,
  buildComplianceConfidenceObservabilitySurface,
  buildComplianceConfidenceRecord,
  computeComplianceConfidenceHash,
  replayComplianceConfidence,
  scoreComplianceConfidence,
  validateComplianceConfidenceRecord,
} from "@/services/compliance-confidence";
import type { ComplianceConfidenceRecord, ComplianceConfidenceType, ConfidenceScenario } from "@/types/compliance-confidence";

export async function requireComplianceConfidenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getComplianceConfidenceContract() {
  return buildComplianceConfidenceContract();
}

export async function scoreComplianceConfidenceRequest(request: Request) {
  const body = await readBody(request) as { confidence_type?: ComplianceConfidenceType; scenario?: ConfidenceScenario; tenant_id?: string };
  return scoreComplianceConfidence(body);
}

export async function validateComplianceConfidenceRequest(request: Request) {
  const body = await readBody(request);
  return validateComplianceConfidenceRecord(Object.keys(body).length ? body as Partial<ComplianceConfidenceRecord> : scoreComplianceConfidence());
}

export async function hashComplianceConfidenceRequest(request: Request) {
  const body = await readBody(request);
  const record = Object.keys(body).length ? buildComplianceConfidenceRecord(body as Partial<ComplianceConfidenceRecord>) : scoreComplianceConfidence();
  return { compliance_confidence_hash: computeComplianceConfidenceHash(record) };
}

export async function replayComplianceConfidenceRequest(request: Request) {
  const body = await readBody(request);
  return replayComplianceConfidence(Object.keys(body).length ? buildComplianceConfidenceRecord(body as Partial<ComplianceConfidenceRecord>) : scoreComplianceConfidence());
}

export async function inspectComplianceConfidenceRequest(request?: Request) {
  if (!request) return buildComplianceConfidenceObservabilitySurface();
  const body = await readBody(request);
  return buildComplianceConfidenceObservabilitySurface(Object.keys(body).length ? buildComplianceConfidenceRecord(body as Partial<ComplianceConfidenceRecord>) : scoreComplianceConfidence());
}
