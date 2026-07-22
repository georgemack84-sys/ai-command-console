import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDeterministicDelegationUser, validateCapabilityRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try { await requireDeterministicDelegationUser(); return apiSuccess(await validateCapabilityRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate delegation capability matching."); }
}
