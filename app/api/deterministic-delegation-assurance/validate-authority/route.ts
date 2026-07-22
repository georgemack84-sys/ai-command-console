import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDeterministicDelegationUser, validateAuthorityRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try { await requireDeterministicDelegationUser(); return apiSuccess(await validateAuthorityRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate delegation authority."); }
}
