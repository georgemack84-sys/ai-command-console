import { getCertificationEngineBundle, runCertificationEngine, validateCertificationEngine } from "@/services/certification-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CertificationEngineInput, CertificationEngineResult } from "@/types/certification-engine";

export async function requireCertificationEngineUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): CertificationEngineInput { return body as CertificationEngineInput; }
function resultFromBody(body: Record<string, unknown>): CertificationEngineResult { return (body.result as CertificationEngineResult | undefined) ?? runCertificationEngine(inputFromBody(body)); }
export function contractResponse() { return getCertificationEngineBundle(); }
export async function validateRequest(request: Request) { return validateCertificationEngine(resultFromBody(await readBody(request))); }
export async function serviceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationEngine(); return { service: result.service }; }
export async function agentsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationEngine(); return { agent_certification: result.agent_certification }; }
export async function capabilitiesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationEngine(); return { capability_certification: result.capability_certification }; }
export async function skillsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationEngine(); return { skill_certification: result.skill_certification }; }
export async function runtimeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationEngine(); return { runtime_certification: result.runtime_certification }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationEngine(); return { qualification: result.qualification }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationEngine(); return { registry: result.registry }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationEngine(); return { lifecycle: result.lifecycle }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationEngine(); return { evidence_integration: result.evidence_integration }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationEngine(); return { governance: result.governance }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationEngine(); return { apis: result.apis }; }
export async function viewRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationEngine(); return { view: result.view }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationEngine(); return { reports: result.reports }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationEngine(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
