import {
  buildConstitutionalBaselineObservabilitySurface,
  getConstitutionalAuthorityModel,
  getConstitutionalBaselineContract,
  getConstitutionalBaselineContractBundle,
  getConstitutionalComplianceSchema,
  getConstitutionalGovernanceRequirements,
  getConstitutionalInvariants,
  listConstitutionalAuditRecords,
  validateConstitutionalBaseline,
} from "@/services/constitutional-baseline-contract";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ConstitutionalBaselineContract, ConstitutionalBaselineInput } from "@/types/constitutional-baseline-contract";

export async function requireConstitutionalBaselineUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function contractFromBody(body: Record<string, unknown>): ConstitutionalBaselineContract {
  return (body.contract as ConstitutionalBaselineContract | undefined) ?? getConstitutionalBaselineContract(body as ConstitutionalBaselineInput);
}

export function contractResponse() { return getConstitutionalBaselineContractBundle(); }
export async function contractRequest(request: Request) { return getConstitutionalBaselineContract((await readBody(request)) as ConstitutionalBaselineInput); }
export async function invariantsRequest(request: Request) { return getConstitutionalInvariants((await readBody(request)) as ConstitutionalBaselineInput); }
export async function schemaRequest(request: Request) { return getConstitutionalComplianceSchema((await readBody(request)) as ConstitutionalBaselineInput); }
export async function authorityRequest(request: Request) { return getConstitutionalAuthorityModel((await readBody(request)) as ConstitutionalBaselineInput); }
export async function governanceRequest(request: Request) { return getConstitutionalGovernanceRequirements((await readBody(request)) as ConstitutionalBaselineInput); }
export async function auditRequest(request: Request) { return listConstitutionalAuditRecords((await readBody(request)) as ConstitutionalBaselineInput); }
export async function validateRequest(request: Request) { return validateConstitutionalBaseline(contractFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildConstitutionalBaselineObservabilitySurface();
  return buildConstitutionalBaselineObservabilitySurface(contractFromBody(await readBody(request)));
}
