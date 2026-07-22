import {
  buildConstitutionalLearningObservabilitySurface,
  getConstitutionalLearningValidationEngine,
  listConstitutionalLearningExplanations,
  listConstitutionalLearningLedger,
  listConstitutionalLearningRecords,
  listConstitutionalLearningRejections,
  validateConstitutionalLearning,
  validateConstitutionalLearningRepository,
} from "@/services/constitutional-learning-validation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ConstitutionalLearningValidationInput, ConstitutionalLearningValidationRepository } from "@/types/constitutional-learning-validation";

export async function requireConstitutionalLearningValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): ConstitutionalLearningValidationRepository {
  return (body.repository as ConstitutionalLearningValidationRepository | undefined) ?? validateConstitutionalLearning(body as ConstitutionalLearningValidationInput);
}

export function contractResponse() { return getConstitutionalLearningValidationEngine(); }
export async function validateLearningRequest(request: Request) { return validateConstitutionalLearning((await readBody(request)) as ConstitutionalLearningValidationInput); }
export async function recordsRequest(request: Request) { return listConstitutionalLearningRecords((await readBody(request)) as ConstitutionalLearningValidationInput); }
export async function rejectionsRequest(request: Request) { return listConstitutionalLearningRejections((await readBody(request)) as ConstitutionalLearningValidationInput); }
export async function explanationsRequest(request: Request) { return listConstitutionalLearningExplanations((await readBody(request)) as ConstitutionalLearningValidationInput); }
export async function ledgerRequest(request: Request) { return listConstitutionalLearningLedger((await readBody(request)) as ConstitutionalLearningValidationInput); }
export async function validateRequest(request: Request) { return validateConstitutionalLearningRepository(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildConstitutionalLearningObservabilitySurface();
  return buildConstitutionalLearningObservabilitySurface(repositoryFromBody(await readBody(request)));
}
