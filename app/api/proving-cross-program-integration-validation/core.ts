import { getProvingCrossProgramIntegrationValidationBundle, runProvingCrossProgramIntegrationValidation, validateProvingCrossProgramIntegrationValidation } from "@/services/proving-cross-program-integration-validation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { IntegrationInput, IntegrationResult } from "@/types/proving-cross-program-integration-validation";

export async function requireCrossProgramIntegrationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): IntegrationInput { return body as IntegrationInput; }
function resultFromBody(body: Record<string, unknown>): IntegrationResult { return (body.result as IntegrationResult | undefined) ?? runProvingCrossProgramIntegrationValidation(inputFromBody(body)); }
export function contractResponse() { return getProvingCrossProgramIntegrationValidationBundle(); }
export async function validateRequest(request: Request) { return validateProvingCrossProgramIntegrationValidation(resultFromBody(await readBody(request))); }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCrossProgramIntegrationValidation(); return { dependency_report: result.dependency_report }; }
export async function interfacesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCrossProgramIntegrationValidation(); return { interface_report: result.interface_report }; }
export async function workflowRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCrossProgramIntegrationValidation(); return { workflow_report: result.workflow_report }; }
export async function eventsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCrossProgramIntegrationValidation(); return { event_report: result.event_report }; }
export async function dataRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCrossProgramIntegrationValidation(); return { data_report: result.data_report }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCrossProgramIntegrationValidation(); return { governance_report: result.governance_report }; }
export async function trustRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCrossProgramIntegrationValidation(); return { trust_report: result.trust_report }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCrossProgramIntegrationValidation(); return { replay_report: result.replay_report }; }
export async function ecosystemRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCrossProgramIntegrationValidation(); return { ecosystem_report: result.ecosystem_report }; }
export async function matrixRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCrossProgramIntegrationValidation(); return { compatibility_matrix: result.compatibility_matrix }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCrossProgramIntegrationValidation(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingCrossProgramIntegrationValidation(); return { gates: result.gates, boundaries: result.boundaries, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
