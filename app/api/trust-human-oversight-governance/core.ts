import { getTrustHumanOversightGovernanceBundle, runTrustHumanOversightGovernance, validateTrustHumanOversightGovernance } from "@/services/trust-human-oversight-governance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustHumanOversightInput, TrustHumanOversightResult } from "@/types/trust-human-oversight-governance";

export async function requireTrustHumanOversightUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustHumanOversightInput { return body as TrustHumanOversightInput; }
function resultFromBody(body: Record<string, unknown>): TrustHumanOversightResult { return (body.result as TrustHumanOversightResult | undefined) ?? runTrustHumanOversightGovernance(inputFromBody(body)); }
export function contractResponse() { return getTrustHumanOversightGovernanceBundle(); }
export async function validateRequest(request: Request) { return validateTrustHumanOversightGovernance(resultFromBody(await readBody(request))); }
export async function operatorRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustHumanOversightGovernance(); return { operator_review: result.operator_review, workflow: result.workflow }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustHumanOversightGovernance(); return { governance_review: result.governance_review, authority: result.authority }; }
export async function restorationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustHumanOversightGovernance(); return { restoration: result.restoration }; }
export async function ambiguityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustHumanOversightGovernance(); return { ambiguity: result.ambiguity }; }
export async function interventionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustHumanOversightGovernance(); return { intervention: result.intervention }; }
export async function auditRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustHumanOversightGovernance(); return { record: result.record, boundary: result.boundary }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustHumanOversightGovernance(); return { certification: result.certification, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
