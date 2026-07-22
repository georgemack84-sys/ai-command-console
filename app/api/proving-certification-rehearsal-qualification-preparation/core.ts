import { getProvingCertificationRehearsalQualificationPreparationBundle, runProvingCertificationRehearsalQualificationPreparation, validateProvingCertificationRehearsalQualificationPreparation } from "@/services/proving-certification-rehearsal-qualification-preparation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { RehearsalInput, RehearsalResult } from "@/types/proving-certification-rehearsal-qualification-preparation";

export async function requireRehearsalPreparationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): RehearsalInput { return body as RehearsalInput; }
function resultFromBody(body: Record<string, unknown>): RehearsalResult { return (body.result as RehearsalResult | undefined) ?? runProvingCertificationRehearsalQualificationPreparation(inputFromBody(body)); }
export function contractResponse() { return getProvingCertificationRehearsalQualificationPreparationBundle(); }
export async function validateRequest(request: Request) { return validateProvingCertificationRehearsalQualificationPreparation(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCertificationRehearsalQualificationPreparation(); return { certification_rehearsal: result.certification_rehearsal }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCertificationRehearsalQualificationPreparation(); return { qualification_rehearsal: result.qualification_rehearsal }; }
export async function evidenceReportRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCertificationRehearsalQualificationPreparation(); return { evidence_report: result.evidence_report }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCertificationRehearsalQualificationPreparation(); return { governance_report: result.governance_report }; }
export async function packagesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCertificationRehearsalQualificationPreparation(); return { package_report: result.package_report }; }
export async function assessorsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCertificationRehearsalQualificationPreparation(); return { assessor_report: result.assessor_report }; }
export async function operationalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCertificationRehearsalQualificationPreparation(); return { operational_report: result.operational_report }; }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCertificationRehearsalQualificationPreparation(); return { dashboard: result.dashboard }; }
export async function finalReportRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCertificationRehearsalQualificationPreparation(); return { final_report: result.final_report }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCertificationRehearsalQualificationPreparation(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCertificationRehearsalQualificationPreparation(); return { gates: result.gates, boundaries: result.boundaries, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
