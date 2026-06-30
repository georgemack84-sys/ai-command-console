import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeComplianceTrend,
  buildComplianceTrendContract,
  buildComplianceTrendObservabilitySurface,
  buildComplianceTrendRecord,
  computeComplianceTrendHash,
  replayComplianceTrend,
  validateComplianceTrendRecord,
} from "@/services/compliance-trend";
import type { ComplianceTrendRecord, ComplianceTrendScenario, ComplianceTrendWindowType } from "@/types/compliance-trend";
import type { ComplianceType } from "@/types/compliance-contract";

export async function requireComplianceTrendUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getComplianceTrendContract() {
  return buildComplianceTrendContract();
}

export async function analyzeComplianceTrendRequest(request: Request) {
  const body = await readBody(request) as { tenant_id?: string; mission_id?: string; compliance_type?: ComplianceType; scenario?: ComplianceTrendScenario; window_type?: ComplianceTrendWindowType };
  return analyzeComplianceTrend(body);
}

export async function validateComplianceTrendRequest(request: Request) {
  const body = await readBody(request);
  return validateComplianceTrendRecord(Object.keys(body).length ? body as Partial<ComplianceTrendRecord> : analyzeComplianceTrend());
}

export async function hashComplianceTrendRequest(request: Request) {
  const body = await readBody(request);
  const record = Object.keys(body).length ? buildComplianceTrendRecord(body as Partial<ComplianceTrendRecord>) : analyzeComplianceTrend();
  return { compliance_trend_hash: computeComplianceTrendHash(record) };
}

export async function replayComplianceTrendRequest(request: Request) {
  const body = await readBody(request);
  return replayComplianceTrend(Object.keys(body).length ? buildComplianceTrendRecord(body as Partial<ComplianceTrendRecord>) : analyzeComplianceTrend());
}

export async function inspectComplianceTrendRequest(request?: Request) {
  if (!request) return buildComplianceTrendObservabilitySurface();
  const body = await readBody(request);
  return buildComplianceTrendObservabilitySurface(Object.keys(body).length ? buildComplianceTrendRecord(body as Partial<ComplianceTrendRecord>) : analyzeComplianceTrend());
}
