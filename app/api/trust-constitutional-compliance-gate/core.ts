import { getConstitutionalComplianceGateBundle, runConstitutionalComplianceGate, validateConstitutionalComplianceGate } from "@/services/trust-constitutional-compliance-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ConstitutionalComplianceGateInput, ConstitutionalComplianceGateResult } from "@/types/trust-constitutional-compliance-gate";

export async function requireConstitutionalComplianceGateUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ConstitutionalComplianceGateInput { return body as ConstitutionalComplianceGateInput; }
function resultFromBody(body: Record<string, unknown>): ConstitutionalComplianceGateResult { return (body.result as ConstitutionalComplianceGateResult | undefined) ?? runConstitutionalComplianceGate(inputFromBody(body)); }
export function contractResponse() { return getConstitutionalComplianceGateBundle(); }
export async function validateRequest(request: Request) { return validateConstitutionalComplianceGate(resultFromBody(await readBody(request))); }
export async function rulesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalComplianceGate(); return { rules: result.rules }; }
export async function admissibilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalComplianceGate(); return { admissibility: result.admissibility, decision_record: result.decision_record }; }
export async function violationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalComplianceGate(); return { violations: result.violations }; }
export async function failClosedRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalComplianceGate(); return { fail_closed: result.fail_closed }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalComplianceGate(); return { evidence: result.evidence }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalComplianceGate(); return { replay: result.replay }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConstitutionalComplianceGate(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
