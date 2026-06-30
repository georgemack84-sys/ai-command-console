import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAuthorityValidationPackage,
  buildAuthorityValidationVisibilitySurface,
  getAuthorityValidationFramework,
  replayAuthorityValidation,
  validateClassificationAuthority,
} from "@/services/authority-validation-engine";
import type { AuthorityValidationScenario } from "@/types/authority-validation-engine";
import type { TaskClassificationPackage } from "@/types/task-classification-engine";

export async function requireAuthorityValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getAuthorityValidationResponse() {
  return getAuthorityValidationFramework();
}

export async function validateAuthorityRequest(request: Request) {
  const body = await readBody(request);
  return validateClassificationAuthority({
    scenario: body.scenario as AuthorityValidationScenario | undefined,
    classificationPackage: body.classificationPackage as TaskClassificationPackage | undefined,
  });
}

export async function packageAuthorityValidationRequest(request: Request) {
  const body = await readBody(request);
  return buildAuthorityValidationPackage({
    scenario: body.scenario as AuthorityValidationScenario | undefined,
    classificationPackage: body.classificationPackage as TaskClassificationPackage | undefined,
  });
}

export async function replayAuthorityValidationRequest(request: Request) {
  const result = await validateAuthorityRequest(request);
  return replayAuthorityValidation(result);
}

export async function inspectAuthorityValidationRequest(request?: Request) {
  if (!request) return buildAuthorityValidationVisibilitySurface();
  return buildAuthorityValidationVisibilitySurface(await packageAuthorityValidationRequest(request));
}
