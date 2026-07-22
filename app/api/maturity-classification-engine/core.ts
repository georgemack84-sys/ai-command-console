import {
  buildMaturityClassificationObservabilitySurface,
  classifyMaturity,
  getMaturityClassificationEngineBundle,
  getMaturityTransitionEvaluation,
  listMaturityClassificationLedger,
  listMaturityClassificationRules,
  validateMaturityClassification,
} from "@/services/maturity-classification-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { MaturityClassificationInput, MaturityClassificationRepository } from "@/types/maturity-classification-engine";

export async function requireMaturityClassificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): MaturityClassificationRepository {
  return (body.repository as MaturityClassificationRepository | undefined) ?? classifyMaturity(body as MaturityClassificationInput);
}

export function classificationBundleResponse() { return getMaturityClassificationEngineBundle(); }
export async function classifyRequest(request: Request) { return classifyMaturity((await readBody(request)) as MaturityClassificationInput); }
export async function rulesRequest(request: Request) { return listMaturityClassificationRules((await readBody(request)) as MaturityClassificationInput); }
export async function transitionsRequest(request: Request) { return getMaturityTransitionEvaluation((await readBody(request)) as MaturityClassificationInput); }
export async function ledgerRequest(request: Request) { return listMaturityClassificationLedger((await readBody(request)) as MaturityClassificationInput); }
export async function validateRequest(request: Request) { return validateMaturityClassification(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildMaturityClassificationObservabilitySurface();
  return buildMaturityClassificationObservabilitySurface(repositoryFromBody(await readBody(request)));
}
