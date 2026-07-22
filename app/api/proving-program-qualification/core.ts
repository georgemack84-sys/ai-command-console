import { getProvingProgramQualificationBundle, runProvingProgramQualification, validateProvingProgramQualification } from "@/services/proving-program-qualification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProgramQualificationInput, ProgramQualificationResult } from "@/types/proving-program-qualification";

export async function requireProgramQualificationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProgramQualificationInput { return body as ProgramQualificationInput; }
function resultFromBody(body: Record<string, unknown>): ProgramQualificationResult { return (body.result as ProgramQualificationResult | undefined) ?? runProvingProgramQualification(inputFromBody(body)); }
export function contractResponse() { return getProvingProgramQualificationBundle(); }
export async function validateRequest(request: Request) { return validateProvingProgramQualification(resultFromBody(await readBody(request))); }
export async function domainsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingProgramQualification(); return { domain_reports: result.domain_reports }; }
export async function reportRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingProgramQualification(); return { program_report: result.program_report }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingProgramQualification(); return { evidence_ledger: result.evidence_ledger }; }
export async function traceabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingProgramQualification(); return { traceability_matrix: result.traceability_matrix }; }
export async function crossProgramRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingProgramQualification(); return { cross_program_matrix: result.cross_program_matrix }; }
export async function approvalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingProgramQualification(); return { approval_record: result.approval_record }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingProgramQualification(); return { decision_record: result.decision_record }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingProgramQualification(); return { gates: result.gates, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
