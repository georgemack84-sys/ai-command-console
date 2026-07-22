import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAuthoritySeparationUser, validateEscalationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try { await requireAuthoritySeparationUser(); return apiSuccess(await validateEscalationRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate authority escalation boundaries."); }
}
