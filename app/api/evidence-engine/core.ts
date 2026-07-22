import { getEvidenceEngineBundle, runEvidenceEngine, validateEvidenceEngine } from "@/services/evidence-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { EvidenceEngineInput, EvidenceEngineResult } from "@/types/evidence-engine";

export async function requireEvidenceEngineUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): EvidenceEngineInput { return body as EvidenceEngineInput; }
function resultFromBody(body: Record<string, unknown>): EvidenceEngineResult { return (body.result as EvidenceEngineResult | undefined) ?? runEvidenceEngine(inputFromBody(body)); }
export function contractResponse() { return getEvidenceEngineBundle(); }
export async function validateRequest(request: Request) { return validateEvidenceEngine(resultFromBody(await readBody(request))); }
export async function captureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEvidenceEngine(); return { capture: result.capture }; }
export async function packagesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEvidenceEngine(); return { packages: result.packages }; }
export async function indexRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEvidenceEngine(); return { index: result.index }; }
export async function validationEngineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEvidenceEngine(); return { validation_engine: result.validation_engine }; }
export async function provenanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEvidenceEngine(); return { provenance: result.provenance }; }
export async function contractsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEvidenceEngine(); return { contracts: result.contracts }; }
export async function explorerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEvidenceEngine(); return { explorer: result.explorer }; }
export async function runtimeIntegrationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEvidenceEngine(); return { runtime_integration: result.runtime_integration }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEvidenceEngine(); return { apis: result.apis }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEvidenceEngine(); return { security: result.security }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEvidenceEngine(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
