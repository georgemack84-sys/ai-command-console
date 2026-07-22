import {
  getApplicationIntegrationFrameworkBundle,
  runApplicationIntegrationFramework,
  validateApplicationIntegrationFramework,
} from "@/services/application-integration-framework";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ApplicationIntegrationFrameworkResult, ApplicationIntegrationInput } from "@/types/application-integration-framework";

export async function requireApplicationIntegrationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ApplicationIntegrationInput { return body as ApplicationIntegrationInput; }
function resultFromBody(body: Record<string, unknown>): ApplicationIntegrationFrameworkResult { return (body.result as ApplicationIntegrationFrameworkResult | undefined) ?? runApplicationIntegrationFramework(inputFromBody(body)); }

export function contractResponse() { return getApplicationIntegrationFrameworkBundle(); }
export async function validateRequest(request: Request) { return validateApplicationIntegrationFramework(resultFromBody(await readBody(request))); }
export async function contractsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIntegrationFramework(); return { integration_contract: result.integration_contract }; }
export async function cciRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIntegrationFramework(); return { cci_adapter: result.cci_adapter }; }
export async function cafRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIntegrationFramework(); return { caf_adapter: result.caf_adapter }; }
export async function gatewayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIntegrationFramework(); return { application_gateway: result.application_gateway }; }
export async function interfacesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIntegrationFramework(); return { interface_record: result.interface_record }; }
export async function interoperabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIntegrationFramework(); return { integration_record: result.integration_record }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIntegrationFramework(); return { interface_governance: result.interface_governance }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIntegrationFramework(); return { evidence: result.evidence }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationIntegrationFramework(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
