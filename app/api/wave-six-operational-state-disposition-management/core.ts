import { getWaveSixOperationalStateDispositionManagementBundle, runWaveSixOperationalStateDispositionManagement, validateWaveSixOperationalStateDispositionManagement } from "@/services/wave-six-operational-state-disposition-management";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveSixOperationalStateDispositionInput, WaveSixOperationalStateDispositionResult } from "@/types/wave-six-operational-state-disposition-management";

export async function requireWaveSixOperationalStateDispositionManagementUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveSixOperationalStateDispositionInput { return body as WaveSixOperationalStateDispositionInput; }
function resultFromBody(body: Record<string, unknown>): WaveSixOperationalStateDispositionResult { return (body.result as WaveSixOperationalStateDispositionResult | undefined) ?? runWaveSixOperationalStateDispositionManagement(inputFromBody(body)); }
export function contractResponse() { return getWaveSixOperationalStateDispositionManagementBundle(); }
export async function validateRequest(request: Request) { return validateWaveSixOperationalStateDispositionManagement(resultFromBody(await readBody(request))); }
export async function lifecycleManagerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalStateDispositionManagement(); return { lifecycle_manager: result.lifecycle_manager }; }
export async function stateDispositionModelRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalStateDispositionManagement(); return { state_disposition_model: result.state_disposition_model }; }
export async function transitionLineageEvidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalStateDispositionManagement(); return { transition_lineage_evidence: result.transition_lineage_evidence }; }
export async function replayReportingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalStateDispositionManagement(); return { replay_reporting: result.replay_reporting }; }
export async function ownershipBoundaryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalStateDispositionManagement(); return { ownership_boundary: result.ownership_boundary }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalStateDispositionManagement(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
