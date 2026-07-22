import { getCapabilityRegistryBundle, runCapabilityRegistry, validateCapabilityRegistry } from "@/services/capability-registry";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CapabilityRegistryInput, CapabilityRegistryResult } from "@/types/capability-registry";

export async function requireCapabilityRegistryUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): CapabilityRegistryInput { return body as CapabilityRegistryInput; }
function resultFromBody(body: Record<string, unknown>): CapabilityRegistryResult { return (body.result as CapabilityRegistryResult | undefined) ?? runCapabilityRegistry(inputFromBody(body)); }
export function contractResponse() { return getCapabilityRegistryBundle(); }
export async function validateRequest(request: Request) { return validateCapabilityRegistry(resultFromBody(await readBody(request))); }
export async function definitionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityRegistry(); return { definition_system: result.definition_system }; }
export async function compositionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityRegistry(); return { composition_engine: result.composition_engine }; }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityRegistry(); return { dependency_framework: result.dependency_framework }; }
export async function riskRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityRegistry(); return { risk_classification: result.risk_classification }; }
export async function authorityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityRegistry(); return { authority_classification: result.authority_classification }; }
export async function toolBindingsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityRegistry(); return { tool_binding: result.tool_binding }; }
export async function validationEngineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityRegistry(); return { validation_engine: result.validation_engine }; }
export async function apisGovernanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityRegistry(); return { apis_governance: result.apis_governance }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityRegistry(); return { evidence: result.evidence }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityRegistry(); return { qualification: result.qualification }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCapabilityRegistry(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
