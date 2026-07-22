import { getWaveSixOperationalOptimizationBundle, runWaveSixOperationalOptimization, validateWaveSixOperationalOptimization } from "@/services/wave-six-operational-optimization";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveSixOperationalOptimizationInput, WaveSixOperationalOptimizationResult } from "@/types/wave-six-operational-optimization";

export async function requireWaveSixOperationalOptimizationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveSixOperationalOptimizationInput { return body as WaveSixOperationalOptimizationInput; }
function resultFromBody(body: Record<string, unknown>): WaveSixOperationalOptimizationResult { return (body.result as WaveSixOperationalOptimizationResult | undefined) ?? runWaveSixOperationalOptimization(inputFromBody(body)); }
export function contractResponse() { return getWaveSixOperationalOptimizationBundle(); }
export async function validateRequest(request: Request) { return validateWaveSixOperationalOptimization(resultFromBody(await readBody(request))); }
export async function observationEngineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalOptimization(); return { observation_engine: result.observation_engine }; }
export async function bottleneckDetectionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalOptimization(); return { bottleneck_detection: result.bottleneck_detection }; }
export async function resourceWorkflowPerformanceAnalysisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalOptimization(); return { resource_workflow_performance_analysis: result.resource_workflow_performance_analysis }; }
export async function evidenceReportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalOptimization(); return { evidence_reports: result.evidence_reports }; }
export async function optimizationBoundaryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalOptimization(); return { optimization_boundary: result.optimization_boundary }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalOptimization(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
