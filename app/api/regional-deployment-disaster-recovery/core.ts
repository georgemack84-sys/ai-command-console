import { getRegionalDeploymentDisasterRecoveryBundle, runRegionalDeploymentDisasterRecovery, validateRegionalDeploymentDisasterRecovery } from "@/services/regional-deployment-disaster-recovery";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { RegionalDeploymentDisasterRecoveryInput, RegionalDeploymentDisasterRecoveryResult } from "@/types/regional-deployment-disaster-recovery";

export async function requireRegionalDeploymentDisasterRecoveryUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): RegionalDeploymentDisasterRecoveryInput { return body as RegionalDeploymentDisasterRecoveryInput; }
function resultFromBody(body: Record<string, unknown>): RegionalDeploymentDisasterRecoveryResult { return (body.result as RegionalDeploymentDisasterRecoveryResult | undefined) ?? runRegionalDeploymentDisasterRecovery(inputFromBody(body)); }

export function contractResponse() { return getRegionalDeploymentDisasterRecoveryBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runRegionalDeploymentDisasterRecovery(); }
export async function deploymentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegionalDeploymentDisasterRecovery(); return { deployment_manager: result.deployment_manager, health_monitor: result.health_monitor, dashboard: result.dashboard }; }
export async function authorizationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegionalDeploymentDisasterRecovery(); return { authorization_service: result.authorization_service, recovery_request: result.recovery_request }; }
export async function recoveryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegionalDeploymentDisasterRecovery(); return { recovery_engine: result.recovery_engine, evidence_manager: result.evidence_manager }; }
export async function validationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegionalDeploymentDisasterRecovery(); return { validation_service: result.validation_service, replay_validator: result.replay_validator }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegionalDeploymentDisasterRecovery(); return { recovery_ledger: result.recovery_ledger, replay_validator: result.replay_validator, evidence_manager: result.evidence_manager }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegionalDeploymentDisasterRecovery(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateRegionalDeploymentDisasterRecovery(resultFromBody(await readBody(request))); }
