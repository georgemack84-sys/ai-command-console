import { getWaveSixDependencyServiceCoordinationBundle, runWaveSixDependencyServiceCoordination, validateWaveSixDependencyServiceCoordination } from "@/services/wave-six-dependency-service-coordination";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveSixDependencyServiceCoordinationInput, WaveSixDependencyServiceCoordinationResult } from "@/types/wave-six-dependency-service-coordination";

export async function requireWaveSixDependencyServiceCoordinationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveSixDependencyServiceCoordinationInput { return body as WaveSixDependencyServiceCoordinationInput; }
function resultFromBody(body: Record<string, unknown>): WaveSixDependencyServiceCoordinationResult { return (body.result as WaveSixDependencyServiceCoordinationResult | undefined) ?? runWaveSixDependencyServiceCoordination(inputFromBody(body)); }
export function contractResponse() { return getWaveSixDependencyServiceCoordinationBundle(); }
export async function validateRequest(request: Request) { return validateWaveSixDependencyServiceCoordination(resultFromBody(await readBody(request))); }
export async function dependencyRegistryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixDependencyServiceCoordination(); return { dependency_registry: result.dependency_registry }; }
export async function providerObservationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixDependencyServiceCoordination(); return { provider_observation: result.provider_observation }; }
export async function readinessCoordinationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixDependencyServiceCoordination(); return { readiness_coordination: result.readiness_coordination }; }
export async function operationalReadinessFailureAnalysisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixDependencyServiceCoordination(); return { operational_readiness_failure_analysis: result.operational_readiness_failure_analysis }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixDependencyServiceCoordination(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixDependencyServiceCoordination(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
