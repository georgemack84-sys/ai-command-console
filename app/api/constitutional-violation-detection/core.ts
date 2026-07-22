import {
  buildConstitutionalViolationDetectionObservabilitySurface,
  detectConstitutionalViolations,
  getConstitutionalViolationDetectionEngine,
  listConstitutionalSeverityClassifications,
  listConstitutionalViolationAlerts,
  listConstitutionalViolationEvidence,
  listConstitutionalViolationLedger,
  listConstitutionalViolationRecords,
  validateConstitutionalViolationDetection,
} from "@/services/constitutional-violation-detection";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ConstitutionalViolationDetectionInput, ConstitutionalViolationDetectionRepository } from "@/types/constitutional-violation-detection";

export async function requireConstitutionalViolationDetectionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): ConstitutionalViolationDetectionRepository {
  return (body.repository as ConstitutionalViolationDetectionRepository | undefined) ?? detectConstitutionalViolations(body as ConstitutionalViolationDetectionInput);
}

export function contractResponse() { return getConstitutionalViolationDetectionEngine(); }
export async function detectRequest(request: Request) { return detectConstitutionalViolations((await readBody(request)) as ConstitutionalViolationDetectionInput); }
export async function violationsRequest(request: Request) { return listConstitutionalViolationRecords((await readBody(request)) as ConstitutionalViolationDetectionInput); }
export async function classificationsRequest(request: Request) { return listConstitutionalSeverityClassifications((await readBody(request)) as ConstitutionalViolationDetectionInput); }
export async function evidenceRequest(request: Request) { return listConstitutionalViolationEvidence((await readBody(request)) as ConstitutionalViolationDetectionInput); }
export async function ledgerRequest(request: Request) { return listConstitutionalViolationLedger((await readBody(request)) as ConstitutionalViolationDetectionInput); }
export async function alertsRequest(request: Request) { return listConstitutionalViolationAlerts((await readBody(request)) as ConstitutionalViolationDetectionInput); }
export async function validateRequest(request: Request) { return validateConstitutionalViolationDetection(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildConstitutionalViolationDetectionObservabilitySurface();
  return buildConstitutionalViolationDetectionObservabilitySurface(repositoryFromBody(await readBody(request)));
}
