import { getContinuousAssuranceCertificationBundle, runContinuousAssuranceCertification, validateContinuousAssuranceCertification } from "@/services/continuous-assurance-certification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ContinuousAssuranceInput, ContinuousAssuranceResult } from "@/types/continuous-assurance-certification";

export async function requireContinuousAssuranceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ContinuousAssuranceInput { return body as ContinuousAssuranceInput; }
function resultFromBody(body: Record<string, unknown>): ContinuousAssuranceResult { return (body.result as ContinuousAssuranceResult | undefined) ?? runContinuousAssuranceCertification(inputFromBody(body)); }

export function contractResponse() { return getContinuousAssuranceCertificationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runContinuousAssuranceCertification(); }
export async function healthRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousAssuranceCertification(); return { health: result.health, evaluation: result.evaluation }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousAssuranceCertification(); return { freshness: result.freshness, evidence_refs: result.certification_record.evidence_refs }; }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousAssuranceCertification(); return { dependency_reverification: result.dependency_reverification, dependency_refs: result.certification_record.dependency_refs }; }
export async function recertificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousAssuranceCertification(); return { recertification_schedule: result.recertification_schedule, certification_status: result.certification_record.certification_status }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousAssuranceCertification(); return { ledger: result.ledger, certification_record: result.certification_record }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousAssuranceCertification(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateContinuousAssuranceCertification(resultFromBody(await readBody(request))); }
