import { getOperationalResilienceRecoveryGovernanceBundle, runOperationalResilienceRecoveryGovernance, validateOperationalResilienceRecoveryGovernance } from "@/services/operational-resilience-recovery-governance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { OperationalResilienceRecoveryGovernanceInput, OperationalResilienceRecoveryGovernanceResult } from "@/types/operational-resilience-recovery-governance";

export async function requireOperationalResilienceRecoveryGovernanceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): OperationalResilienceRecoveryGovernanceInput { return body as OperationalResilienceRecoveryGovernanceInput; }
function resultFromBody(body: Record<string, unknown>): OperationalResilienceRecoveryGovernanceResult { return (body.result as OperationalResilienceRecoveryGovernanceResult | undefined) ?? runOperationalResilienceRecoveryGovernance(inputFromBody(body)); }

export function contractResponse() { return getOperationalResilienceRecoveryGovernanceBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runOperationalResilienceRecoveryGovernance(); }
export async function orchestratorRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalResilienceRecoveryGovernance(); return { recovery_state: result.recovery_state, orchestrator: result.orchestrator, dashboard: result.dashboard }; }
export async function containmentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalResilienceRecoveryGovernance(); return { containment_engine: result.containment_engine, authorization_service: result.authorization_service }; }
export async function recoveryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalResilienceRecoveryGovernance(); return { dependency_planner: result.dependency_planner, recovery_coordinator: result.recovery_coordinator, evidence_service: result.evidence_service }; }
export async function validationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalResilienceRecoveryGovernance(); return { recovery_validator: result.recovery_validator, replay_validator: result.replay_validator, post_recovery_qualification: result.post_recovery_qualification }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalResilienceRecoveryGovernance(); return { incident_ledger: result.incident_ledger, recovery_state: result.recovery_state }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalResilienceRecoveryGovernance(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateOperationalResilienceRecoveryGovernance(resultFromBody(await readBody(request))); }
