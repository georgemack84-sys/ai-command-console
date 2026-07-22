import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildFinalPhase10Observability, certifyFinalPhase10, getFinalPhase10Contract, validateFinalPhase10Certification } from "@/services/final-phase-10-certification-gate";
import type { FinalPhase10Input, FinalPhase10Result } from "@/types/final-phase-10-certification-gate";

export async function requireFinalPhase10User() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): FinalPhase10Input { return body as FinalPhase10Input; }
function resultFromBody(body: Record<string, unknown>): FinalPhase10Result { return (body.result as FinalPhase10Result | undefined) ?? certifyFinalPhase10(inputFromBody(body)); }
export function contractResponse() { return getFinalPhase10Contract(); }
export async function dashboardRequest(request: Request) { return certifyFinalPhase10(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateFinalPhase10Certification(resultFromBody(await readBody(request))); }
export async function sectionRequest(request: Request, key: "record" | "dependency_validation" | "end_to_end_qualification" | "constitutional_qualification" | "governance_qualification" | "operational_qualification" | "production_authorization" | "completion_certificate" | "final_report") { return resultFromBody(await readBody(request))[key]; }
export async function inspectRequest(request?: Request) { if (!request) return buildFinalPhase10Observability(); return buildFinalPhase10Observability(resultFromBody(await readBody(request))); }
