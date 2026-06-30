import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildComplianceEvaluationContract,
  buildComplianceEvaluationObservabilitySurface,
  buildComplianceEvaluationRecord,
  computeComplianceEvaluationHash,
  evaluateCompliance,
  replayComplianceEvaluation,
  validateComplianceEvaluationRecord,
} from "@/services/compliance-evaluation";
import type { ComplianceEvaluationRecord, ComplianceEvaluationRequest } from "@/types/compliance-evaluation";

export async function requireComplianceEvaluationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getComplianceEvaluationContract() {
  return buildComplianceEvaluationContract();
}

export async function evaluateComplianceRequest(request: Request) {
  const body = await readBody(request);
  return evaluateCompliance(body as Partial<ComplianceEvaluationRequest>);
}

export async function validateComplianceEvaluationRequest(request: Request) {
  const body = await readBody(request);
  return validateComplianceEvaluationRecord(Object.keys(body).length ? body as Partial<ComplianceEvaluationRecord> : evaluateCompliance());
}

export async function hashComplianceEvaluationRequest(request: Request) {
  const body = await readBody(request);
  const record = Object.keys(body).length ? buildComplianceEvaluationRecord(body as Partial<ComplianceEvaluationRecord>) : evaluateCompliance();
  return { compliance_evaluation_hash: computeComplianceEvaluationHash(record) };
}

export async function replayComplianceEvaluationRequest(request: Request) {
  const body = await readBody(request);
  return replayComplianceEvaluation(Object.keys(body).length ? buildComplianceEvaluationRecord(body as Partial<ComplianceEvaluationRecord>) : evaluateCompliance());
}

export async function inspectComplianceEvaluationRequest(request?: Request) {
  if (!request) return buildComplianceEvaluationObservabilitySurface();
  const body = await readBody(request);
  return buildComplianceEvaluationObservabilitySurface(Object.keys(body).length ? buildComplianceEvaluationRecord(body as Partial<ComplianceEvaluationRecord>) : evaluateCompliance());
}
