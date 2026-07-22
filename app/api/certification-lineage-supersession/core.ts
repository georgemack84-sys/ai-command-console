import { getCertificationLineageSupersessionBundle, runCertificationLineageSupersession, validateCertificationLineageSupersession } from "@/services/certification-lineage-supersession";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CertificationLineageInput, CertificationLineageResult } from "@/types/certification-lineage-supersession";

export async function requireCertificationLineageUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): CertificationLineageInput { return body as CertificationLineageInput; }
function resultFromBody(body: Record<string, unknown>): CertificationLineageResult { return (body.result as CertificationLineageResult | undefined) ?? runCertificationLineageSupersession(inputFromBody(body)); }

export function contractResponse() { return getCertificationLineageSupersessionBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runCertificationLineageSupersession(); }
export async function violationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationLineageSupersession(); return { violations: result.violations }; }
export async function certificationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationLineageSupersession(); return { certification_attempts: result.certification_attempts, remediation: result.remediation }; }
export async function supersessionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationLineageSupersession(); return { supersession: result.supersession }; }
export async function escalationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationLineageSupersession(); return { production_escalation: result.production_escalation }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCertificationLineageSupersession(); return { lineage_graph: result.lineage_graph, certification_tests: result.certification_tests }; }
export async function validateRequest(request: Request) { return validateCertificationLineageSupersession(resultFromBody(await readBody(request))); }
