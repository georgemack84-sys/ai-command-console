import { getProvingReplayValidationFrameworkBundle, runProvingReplayValidationFramework, validateProvingReplayValidationFramework } from "@/services/proving-replay-validation-framework";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ReplayValidationInput, ReplayValidationResult } from "@/types/proving-replay-validation-framework";

export async function requireReplayValidationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ReplayValidationInput { return body as ReplayValidationInput; }
function resultFromBody(body: Record<string, unknown>): ReplayValidationResult { return (body.result as ReplayValidationResult | undefined) ?? runProvingReplayValidationFramework(inputFromBody(body)); }
export function contractResponse() { return getProvingReplayValidationFrameworkBundle(); }
export async function validateRequest(request: Request) { return validateProvingReplayValidationFramework(resultFromBody(await readBody(request))); }
export async function executionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingReplayValidationFramework(); return { execution: result.execution, deterministic_result: result.deterministic_result }; }
export async function inputsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingReplayValidationFramework(); return { inputs: result.inputs }; }
export async function comparisonRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingReplayValidationFramework(); return { comparison: result.comparison }; }
export async function divergenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingReplayValidationFramework(); return { divergences: result.divergences }; }
export async function explainabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingReplayValidationFramework(); return { explanations: result.divergences.map((divergence) => ({ divergence_id: divergence.divergence_id, cause: divergence.cause, impact_assessment: divergence.impact_assessment, affected_evidence: divergence.affected_evidence, explained: divergence.explained })) }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingReplayValidationFramework(); return { certification: result.certification }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingReplayValidationFramework(); return { evidence_registry: result.evidence_registry }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingReplayValidationFramework(); return { gates: result.gates, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
