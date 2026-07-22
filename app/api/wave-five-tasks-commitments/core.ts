import { getWaveFiveTasksCommitmentsBundle, runWaveFiveTasksCommitments, validateWaveFiveTasksCommitments } from "@/services/wave-five-tasks-commitments";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveFiveTasksCommitmentsInput, WaveFiveTasksCommitmentsResult } from "@/types/wave-five-tasks-commitments";

export async function requireWaveFiveTasksCommitmentsUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveFiveTasksCommitmentsInput { return body as WaveFiveTasksCommitmentsInput; }
function resultFromBody(body: Record<string, unknown>): WaveFiveTasksCommitmentsResult { return (body.result as WaveFiveTasksCommitmentsResult | undefined) ?? runWaveFiveTasksCommitments(inputFromBody(body)); }
export function contractResponse() { return getWaveFiveTasksCommitmentsBundle(); }
export async function validateRequest(request: Request) { return validateWaveFiveTasksCommitments(resultFromBody(await readBody(request))); }
export async function tasksRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveTasksCommitments(); return { tasks: result.tasks }; }
export async function commitmentsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveTasksCommitments(); return { commitments: result.commitments }; }
export async function planningRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveTasksCommitments(); return { planning: result.planning }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveTasksCommitments(); return { lifecycle: result.lifecycle }; }
export async function prioritizationSchedulingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveTasksCommitments(); return { prioritization_scheduling: result.prioritization_scheduling }; }
export async function weeklyReviewRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveTasksCommitments(); return { weekly_review: result.weekly_review }; }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveTasksCommitments(); return { dependencies: result.dependencies }; }
export async function integrationGovernanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveTasksCommitments(); return { integration_governance: result.integration_governance }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveTasksCommitments(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
