import { getWaveSixContinuousEcosystemActivationBundle, runWaveSixContinuousEcosystemActivation, validateWaveSixContinuousEcosystemActivation } from "@/services/wave-six-continuous-ecosystem-activation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveSixContinuousEcosystemActivationInput, WaveSixContinuousEcosystemActivationResult } from "@/types/wave-six-continuous-ecosystem-activation";

export async function requireWaveSixContinuousEcosystemActivationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveSixContinuousEcosystemActivationInput { return body as WaveSixContinuousEcosystemActivationInput; }
function resultFromBody(body: Record<string, unknown>): WaveSixContinuousEcosystemActivationResult { return (body.result as WaveSixContinuousEcosystemActivationResult | undefined) ?? runWaveSixContinuousEcosystemActivation(inputFromBody(body)); }
export function contractResponse() { return getWaveSixContinuousEcosystemActivationBundle(); }
export async function validateRequest(request: Request) { return validateWaveSixContinuousEcosystemActivation(resultFromBody(await readBody(request))); }
export async function activationManagerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixContinuousEcosystemActivation(); return { activation_manager: result.activation_manager }; }
export async function programReadinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixContinuousEcosystemActivation(); return { program_readiness: result.program_readiness }; }
export async function lifecycleHealthStatusRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixContinuousEcosystemActivation(); return { lifecycle_health_status: result.lifecycle_health_status }; }
export async function operationsMonitoringReportingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixContinuousEcosystemActivation(); return { operations_monitoring_reporting: result.operations_monitoring_reporting }; }
export async function activationRecoveryBoundaryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixContinuousEcosystemActivation(); return { activation_recovery_boundary: result.activation_recovery_boundary }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixContinuousEcosystemActivation(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
