import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildComplianceCertificationContract,
  buildComplianceCertificationRecord,
  buildComplianceCertificationReport,
  buildComplianceCertificationObservabilitySurface,
  computeComplianceCertificationHash,
  replayComplianceCertification,
  runComplianceCertification,
  validateComplianceCertificationRecord,
} from "@/services/compliance-certification";
import type { ComplianceCertificationComponentKey, ComplianceCertificationRecord, ComplianceCertificationTestResult } from "@/types/compliance-certification";

export async function requireComplianceCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getComplianceCertificationContract() {
  return buildComplianceCertificationContract();
}

export async function runComplianceCertificationRequest(request: Request) {
  const body = await readBody(request) as { tenant_id?: string; mission_id?: string; component_overrides?: Partial<Record<ComplianceCertificationComponentKey, Partial<ComplianceCertificationTestResult>>> };
  return runComplianceCertification(body);
}

export async function validateComplianceCertificationRequest(request: Request) {
  const body = await readBody(request);
  return validateComplianceCertificationRecord(Object.keys(body).length ? body as Partial<ComplianceCertificationRecord> : runComplianceCertification());
}

export async function hashComplianceCertificationRequest(request: Request) {
  const body = await readBody(request);
  const record = Object.keys(body).length ? buildComplianceCertificationRecord(body as Partial<ComplianceCertificationRecord>) : runComplianceCertification();
  return { compliance_certification_hash: computeComplianceCertificationHash(record) };
}

export async function replayComplianceCertificationRequest(request: Request) {
  const body = await readBody(request);
  return replayComplianceCertification(Object.keys(body).length ? buildComplianceCertificationRecord(body as Partial<ComplianceCertificationRecord>) : runComplianceCertification());
}

export async function inspectComplianceCertificationRequest(request?: Request) {
  if (!request) return buildComplianceCertificationObservabilitySurface();
  const body = await readBody(request);
  return buildComplianceCertificationObservabilitySurface(Object.keys(body).length ? buildComplianceCertificationRecord(body as Partial<ComplianceCertificationRecord>) : runComplianceCertification());
}

export async function reportComplianceCertificationRequest(request?: Request) {
  if (!request) return buildComplianceCertificationReport();
  const body = await readBody(request);
  return buildComplianceCertificationReport(Object.keys(body).length ? buildComplianceCertificationRecord(body as Partial<ComplianceCertificationRecord>) : runComplianceCertification());
}
