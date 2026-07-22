import { getProvingSimulationFrameworkBundle, runProvingSimulationFramework, validateProvingSimulationFramework } from "@/services/proving-simulation-framework";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SimulationFrameworkInput, SimulationFrameworkResult } from "@/types/proving-simulation-framework";

export async function requireSimulationFrameworkUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): SimulationFrameworkInput { return body as SimulationFrameworkInput; }
function resultFromBody(body: Record<string, unknown>): SimulationFrameworkResult { return (body.result as SimulationFrameworkResult | undefined) ?? runProvingSimulationFramework(inputFromBody(body)); }
export function contractResponse() { return getProvingSimulationFrameworkBundle(); }
export async function validateRequest(request: Request) { return validateProvingSimulationFramework(resultFromBody(await readBody(request))); }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSimulationFramework(); return { architecture: result.architecture }; }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSimulationFramework(); return { simulation: result.simulation, execution: result.execution, engine: result.engine }; }
export async function eventsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSimulationFramework(); return { event_order: result.execution.event_order, event_simulation: result.engine.event_simulation }; }
export async function operationalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSimulationFramework(); return { operational_simulation: result.engine.operational_simulation, service_interactions: result.execution.service_interactions }; }
export async function missionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSimulationFramework(); return { mission_simulation: result.engine.mission_simulation, mission_id: result.simulation.mission_id }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSimulationFramework(); return { replay_simulation: result.engine.replay_simulation, replay_id: result.execution.replay_id, replay_hash: result.evidence.replay_hash }; }
export async function timeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSimulationFramework(); return { time_service: result.runtime_services.time_service, virtual_time_progression: result.execution.virtual_time_progression }; }
export async function schedulerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSimulationFramework(); return { scheduler_service: result.runtime_services.scheduler_service, scheduler_decisions: result.execution.scheduler_decisions }; }
export async function stateRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSimulationFramework(); return { state_registry: result.state_registry }; }
export async function failureInjectionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSimulationFramework(); return { failure_injection: result.failure_injection }; }
export async function metricsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSimulationFramework(); return { metrics: result.metrics }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSimulationFramework(); return { report: result.report }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSimulationFramework(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingSimulationFramework(); return { gates: result.gates, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
