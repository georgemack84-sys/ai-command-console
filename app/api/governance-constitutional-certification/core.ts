import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceConstitutionalObservability,
  certifyGovernanceConstitutional,
  getGovernanceConstitutionalContract,
  validateGovernanceConstitutionalCertification,
} from "@/services/governance-constitutional-certification";
import type { GovernanceConstitutionalInput, GovernanceConstitutionalResult } from "@/types/governance-constitutional-certification";

export async function requireGovernanceConstitutionalUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): GovernanceConstitutionalInput { return body as GovernanceConstitutionalInput; }
function resultFromBody(body: Record<string, unknown>): GovernanceConstitutionalResult { return (body.result as GovernanceConstitutionalResult | undefined) ?? certifyGovernanceConstitutional(inputFromBody(body)); }
export function contractResponse() { return getGovernanceConstitutionalContract(); }
export async function dashboardRequest(request: Request) { return certifyGovernanceConstitutional(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateGovernanceConstitutionalCertification(resultFromBody(await readBody(request))); }
export async function sectionRequest(request: Request, key: "record" | "governance_supremacy" | "constitutional_enforcement" | "authority_restriction" | "tenant_isolation" | "approval_enforcement" | "bypass_escalation_detection" | "certification_report" | "authority_compliance_report") { return resultFromBody(await readBody(request))[key]; }
export async function inspectRequest(request?: Request) { if (!request) return buildGovernanceConstitutionalObservability(); return buildGovernanceConstitutionalObservability(resultFromBody(await readBody(request))); }
