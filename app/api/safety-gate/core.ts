import { getSafetyGateBundle, runSafetyGate, validateSafetyGate } from "@/services/safety-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SafetyGateInput, SafetyGateResult } from "@/types/safety-gate";

export async function requireSafetyGateUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): SafetyGateInput { return body as SafetyGateInput; }
function resultFromBody(body: Record<string, unknown>): SafetyGateResult { return (body.result as SafetyGateResult | undefined) ?? runSafetyGate(inputFromBody(body)); }
export function contractResponse() { return getSafetyGateBundle(); }
export async function validateRequest(request: Request) { return validateSafetyGate(resultFromBody(await readBody(request))); }
export async function rulesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyGate(); return { rules: result.rules }; }
export async function runtimeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyGate(); return { runtime: result.runtime }; }
export async function emergencyStopRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyGate(); return { emergency_stop: result.emergency_stop }; }
export async function monitoringRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyGate(); return { monitoring: result.monitoring }; }
export async function dispositionMappingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyGate(); return { disposition_mapping: result.disposition_mapping }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyGate(); return { registry: result.registry }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyGate(); return { apis: result.apis }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyGate(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyGate(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
