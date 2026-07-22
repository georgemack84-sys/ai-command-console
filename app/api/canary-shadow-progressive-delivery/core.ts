import { getCanaryShadowProgressiveDeliveryBundle, runCanaryShadowProgressiveDelivery, validateCanaryShadowProgressiveDelivery } from "@/services/canary-shadow-progressive-delivery";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProgressiveDeliveryInput, ProgressiveDeliveryResult } from "@/types/canary-shadow-progressive-delivery";

export async function requireProgressiveDeliveryUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProgressiveDeliveryInput { return body as ProgressiveDeliveryInput; }
function resultFromBody(body: Record<string, unknown>): ProgressiveDeliveryResult { return (body.result as ProgressiveDeliveryResult | undefined) ?? runCanaryShadowProgressiveDelivery(inputFromBody(body)); }

export function contractResponse() { return getCanaryShadowProgressiveDeliveryBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runCanaryShadowProgressiveDelivery(); }
export async function shadowRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCanaryShadowProgressiveDelivery(); return { shadow_execution: result.shadow_execution }; }
export async function canaryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCanaryShadowProgressiveDelivery(); return { canary: result.canary }; }
export async function exposureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCanaryShadowProgressiveDelivery(); return { exposure_policy: result.exposure_policy, exposure_decision: result.exposure_decision }; }
export async function comparisonRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCanaryShadowProgressiveDelivery(); return { comparison: result.comparison, recommendation: result.recommendation, replay: result.replay }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCanaryShadowProgressiveDelivery(); return { certification_record: result.certification_record, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateCanaryShadowProgressiveDelivery(resultFromBody(await readBody(request))); }
