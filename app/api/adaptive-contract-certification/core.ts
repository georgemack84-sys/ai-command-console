import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAdaptiveContractCertificationObservability,
  certifyAdaptiveContract,
  getAdaptiveContractCertificationContract,
  validateAdaptiveContractCertification,
} from "@/services/adaptive-contract-certification";
import type { AdaptiveContractCertificationInput, AdaptiveContractCertificationResult } from "@/types/adaptive-contract-certification";

export async function requireAdaptiveContractCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}
function inputFromBody(body: Record<string, unknown>): AdaptiveContractCertificationInput {
  return body as AdaptiveContractCertificationInput;
}
function resultFromBody(body: Record<string, unknown>): AdaptiveContractCertificationResult {
  return (body.result as AdaptiveContractCertificationResult | undefined) ?? certifyAdaptiveContract(inputFromBody(body));
}
export function contractResponse() {
  return getAdaptiveContractCertificationContract();
}
export async function dashboardRequest(request: Request) {
  return certifyAdaptiveContract(inputFromBody(await readBody(request)));
}
export async function validateRequest(request: Request) {
  return validateAdaptiveContractCertification(resultFromBody(await readBody(request)));
}
export async function sectionRequest(request: Request, key: "record" | "learning_boundary" | "governance_binding" | "constitutional_binding" | "authority_boundary" | "advisory_boundary" | "replay_validation" | "certification_report" | "boundary_report") {
  return resultFromBody(await readBody(request))[key];
}
export async function inspectRequest(request?: Request) {
  if (!request) return buildAdaptiveContractCertificationObservability();
  return buildAdaptiveContractCertificationObservability(resultFromBody(await readBody(request)));
}
