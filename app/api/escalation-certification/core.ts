import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildEscalationCertificationContract,
  buildEscalationCertificationObservabilitySurface,
  buildEscalationCertificationRecord,
  buildEscalationCertificationReport,
  computeEscalationCertificationHash,
  replayEscalationCertification,
  runEscalationCertification,
  validateEscalationCertificationRecord,
} from "@/services/escalation-certification";
import type { EscalationCertificationComponentKey, EscalationCertificationRecord, EscalationCertificationTestResult } from "@/types/escalation-certification";

export async function requireEscalationCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getEscalationCertificationContractResponse() {
  return buildEscalationCertificationContract();
}

export async function runEscalationCertificationRequest(request: Request) {
  const body = await readBody(request) as { tenant_id?: string; mission_id?: string; component_overrides?: Partial<Record<EscalationCertificationComponentKey, Partial<EscalationCertificationTestResult>>> };
  return runEscalationCertification(body);
}

export async function validateEscalationCertificationRequest(request: Request) {
  const body = await readBody(request);
  return validateEscalationCertificationRecord(Object.keys(body).length ? body as Partial<EscalationCertificationRecord> : runEscalationCertification());
}

export async function replayEscalationCertificationRequest(request: Request) {
  const body = await readBody(request);
  return replayEscalationCertification(Object.keys(body).length ? buildEscalationCertificationRecord(body as Partial<EscalationCertificationRecord>) : runEscalationCertification());
}

export async function hashEscalationCertificationRequest(request: Request) {
  const body = await readBody(request);
  const record = Object.keys(body).length ? buildEscalationCertificationRecord(body as Partial<EscalationCertificationRecord>) : runEscalationCertification();
  return { escalation_certification_hash: computeEscalationCertificationHash(record) };
}

export async function inspectEscalationCertificationRequest(request?: Request) {
  if (!request) return buildEscalationCertificationObservabilitySurface();
  const body = await readBody(request);
  return buildEscalationCertificationObservabilitySurface(Object.keys(body).length ? buildEscalationCertificationRecord(body as Partial<EscalationCertificationRecord>) : runEscalationCertification());
}

export async function reportEscalationCertificationRequest(request?: Request) {
  if (!request) return buildEscalationCertificationReport();
  const body = await readBody(request);
  return buildEscalationCertificationReport(Object.keys(body).length ? buildEscalationCertificationRecord(body as Partial<EscalationCertificationRecord>) : runEscalationCertification());
}
