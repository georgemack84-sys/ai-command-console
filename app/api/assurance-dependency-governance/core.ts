import { getAssuranceDependencyGovernanceBundle, runAssuranceDependencyGovernance, validateAssuranceDependencyGovernance } from "@/services/assurance-dependency-governance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AssuranceDependencyGovernanceInput, AssuranceDependencyGovernanceResult } from "@/types/assurance-dependency-governance";

export async function requireAssuranceDependencyGovernanceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AssuranceDependencyGovernanceInput { return body as AssuranceDependencyGovernanceInput; }
function resultFromBody(body: Record<string, unknown>): AssuranceDependencyGovernanceResult { return (body.result as AssuranceDependencyGovernanceResult | undefined) ?? runAssuranceDependencyGovernance(inputFromBody(body)); }

export function contractResponse() { return getAssuranceDependencyGovernanceBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runAssuranceDependencyGovernance(); }
export async function candidatesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyGovernance(); return { candidates: result.candidates }; }
export async function manifestsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyGovernance(); return { manifests: result.manifests }; }
export async function promotionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyGovernance(); return { promotion: result.promotion }; }
export async function verificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyGovernance(); return { manifests: result.manifests, certification_tests: result.certification_tests.slice(6, 12) }; }
export async function blockingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyGovernance(); return { blocking: result.blocking }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyGovernance(); return { governance_ledger: result.governance_ledger, observability: result.observability }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceDependencyGovernance(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateAssuranceDependencyGovernance(resultFromBody(await readBody(request))); }
