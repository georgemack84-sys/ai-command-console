import { getEcosystemApplicationQualificationBundle, runEcosystemApplicationQualification, validateEcosystemApplicationQualification } from "@/services/ecosystem-application-qualification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { EcosystemApplicationQualificationInput, EcosystemApplicationQualificationResult } from "@/types/ecosystem-application-qualification";

export async function requireEcosystemApplicationQualificationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): EcosystemApplicationQualificationInput { return body as EcosystemApplicationQualificationInput; }
function resultFromBody(body: Record<string, unknown>): EcosystemApplicationQualificationResult { return (body.result as EcosystemApplicationQualificationResult | undefined) ?? runEcosystemApplicationQualification(inputFromBody(body)); }
export function contractResponse() { return getEcosystemApplicationQualificationBundle(); }
export async function validateRequest(request: Request) { return validateEcosystemApplicationQualification(resultFromBody(await readBody(request))); }
export async function recordRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemApplicationQualification(); return { record: result.record }; }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemApplicationQualification(); return { architecture: result.architecture }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemApplicationQualification(); return { governance: result.governance }; }
export async function interoperabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemApplicationQualification(); return { interoperability: result.interoperability }; }
export async function operationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemApplicationQualification(); return { operations: result.operations }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemApplicationQualification(); return { replay: result.replay }; }
export async function assuranceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemApplicationQualification(); return { assurance: result.assurance }; }
export async function certificatesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemApplicationQualification(); return { certificates: result.certificates }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemApplicationQualification(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemApplicationQualification(); return { readiness: result.readiness }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemApplicationQualification(); return { report: result.report, ledger: result.ledger, boundary: result.boundary, certification: result.certification, integrity_hash: result.integrity_hash }; }
