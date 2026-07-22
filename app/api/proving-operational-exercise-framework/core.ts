import { getProvingOperationalExerciseFrameworkBundle, runProvingOperationalExerciseFramework, validateProvingOperationalExerciseFramework } from "@/services/proving-operational-exercise-framework";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { OperationalExerciseInput, OperationalExerciseResult } from "@/types/proving-operational-exercise-framework";

export async function requireOperationalExerciseUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): OperationalExerciseInput { return body as OperationalExerciseInput; }
function resultFromBody(body: Record<string, unknown>): OperationalExerciseResult { return (body.result as OperationalExerciseResult | undefined) ?? runProvingOperationalExerciseFramework(inputFromBody(body)); }
export function contractResponse() { return getProvingOperationalExerciseFrameworkBundle(); }
export async function validateRequest(request: Request) { return validateProvingOperationalExerciseFramework(resultFromBody(await readBody(request))); }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingOperationalExerciseFramework(); return { architecture: result.architecture }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingOperationalExerciseFramework(); return { registry: result.registry }; }
export async function tabletopRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingOperationalExerciseFramework(); return { tabletop_report: result.tabletop_report }; }
export async function missionRehearsalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingOperationalExerciseFramework(); return { mission_rehearsal_report: result.mission_rehearsal_report }; }
export async function operatorDrillRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingOperationalExerciseFramework(); return { operator_drill_report: result.operator_drill_report }; }
export async function governanceExerciseRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingOperationalExerciseFramework(); return { governance_exercise_report: result.governance_exercise_report }; }
export async function emergencySimulationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingOperationalExerciseFramework(); return { emergency_simulation_report: result.emergency_simulation_report }; }
export async function executionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingOperationalExerciseFramework(); return { execution: result.execution }; }
export async function evaluationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingOperationalExerciseFramework(); return { evaluation: result.evaluation }; }
export async function metricsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingOperationalExerciseFramework(); return { readiness_metrics: result.readiness_metrics }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingOperationalExerciseFramework(); return { evidence: result.evidence }; }
export async function reportingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingOperationalExerciseFramework(); return { reporting: result.reporting }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingOperationalExerciseFramework(); return { gates: result.gates, boundaries: result.boundaries, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
