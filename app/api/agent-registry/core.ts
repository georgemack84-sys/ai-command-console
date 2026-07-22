import { getAgentRegistryBundle, runAgentRegistry, validateAgentRegistry } from "@/services/agent-registry";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AgentRegistryInput, AgentRegistryResult } from "@/types/agent-registry";

export async function requireAgentRegistryUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AgentRegistryInput { return body as AgentRegistryInput; }
function resultFromBody(body: Record<string, unknown>): AgentRegistryResult { return (body.result as AgentRegistryResult | undefined) ?? runAgentRegistry(inputFromBody(body)); }
export function contractResponse() { return getAgentRegistryBundle(); }
export async function validateRequest(request: Request) { return validateAgentRegistry(resultFromBody(await readBody(request))); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentRegistry(); return { registry_service: result.registry_service }; }
export async function identityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentRegistry(); return { identity_model: result.identity_model }; }
export async function versioningRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentRegistry(); return { versioning: result.versioning }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentRegistry(); return { lineage: result.lineage }; }
export async function discoveryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentRegistry(); return { discovery: result.discovery }; }
export async function ownershipRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentRegistry(); return { ownership: result.ownership }; }
export async function configurationReferencesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentRegistry(); return { configuration_references: result.configuration_references }; }
export async function eligibilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentRegistry(); return { runtime_eligibility: result.runtime_eligibility }; }
export async function certificationTrustRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentRegistry(); return { certification_trust: result.certification_trust }; }
export async function explorerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentRegistry(); return { explorer: result.explorer }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentRegistry(); return { evidence: result.evidence }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentRegistry(); return { qualification: result.qualification }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentRegistry(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
