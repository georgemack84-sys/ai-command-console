import { getPolicyGateBundle, runPolicyGate, validatePolicyGate } from "@/services/policy-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PolicyGateInput, PolicyGateResult } from "@/types/policy-gate";

export async function requirePolicyGateUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PolicyGateInput { return body as PolicyGateInput; }
function resultFromBody(body: Record<string, unknown>): PolicyGateResult { return (body.result as PolicyGateResult | undefined) ?? runPolicyGate(inputFromBody(body)); }
export function contractResponse() { return getPolicyGateBundle(); }
export async function validateRequest(request: Request) { return validatePolicyGate(resultFromBody(await readBody(request))); }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyGate(); return { engine: result.engine }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyGate(); return { registry: result.registry }; }
export async function resolutionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyGate(); return { resolution: result.resolution }; }
export async function hierarchyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyGate(); return { hierarchy: result.hierarchy }; }
export async function conflictsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyGate(); return { conflicts: result.conflicts }; }
export async function exceptionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyGate(); return { exceptions: result.exceptions }; }
export async function dispositionMappingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyGate(); return { disposition_mapping: result.disposition_mapping }; }
export async function decisionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyGate(); return { decisions: result.decisions }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyGate(); return { apis: result.apis }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyGate(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyGate(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
