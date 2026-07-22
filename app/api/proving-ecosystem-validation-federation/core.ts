import { getProvingEcosystemValidationFederationBundle, runProvingEcosystemValidationFederation, validateProvingEcosystemValidationFederation } from "@/services/proving-ecosystem-validation-federation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { FederationInput, FederationResult } from "@/types/proving-ecosystem-validation-federation";

export async function requireFederationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): FederationInput { return body as FederationInput; }
function resultFromBody(body: Record<string, unknown>): FederationResult { return (body.result as FederationResult | undefined) ?? runProvingEcosystemValidationFederation(inputFromBody(body)); }
export function contractResponse() { return getProvingEcosystemValidationFederationBundle(); }
export async function validateRequest(request: Request) { return validateProvingEcosystemValidationFederation(resultFromBody(await readBody(request))); }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemValidationFederation(); return { architecture: result.architecture }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemValidationFederation(); return { registry: result.registry }; }
export async function tenantsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemValidationFederation(); return { multi_tenant_report: result.multi_tenant_report }; }
export async function crossProgramRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemValidationFederation(); return { cross_program_matrix: result.cross_program_matrix }; }
export async function exercisesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemValidationFederation(); return { exercise_report: result.exercise_report }; }
export async function distributedRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemValidationFederation(); return { distributed_scenario_report: result.distributed_scenario_report }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemValidationFederation(); return { replay_report: result.replay_report }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemValidationFederation(); return { evidence: result.evidence }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemValidationFederation(); return { governance_report: result.governance_report }; }
export async function trustRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemValidationFederation(); return { trust_report: result.trust_report }; }
export async function resilienceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemValidationFederation(); return { resilience_report: result.resilience_report }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemValidationFederation(); return { qualification_package: result.qualification_package }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEcosystemValidationFederation(); return { metrics_report: result.metrics_report, decision: result.decision, gates: result.gates, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
