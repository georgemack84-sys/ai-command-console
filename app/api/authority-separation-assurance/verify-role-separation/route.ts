import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAuthoritySeparationUser, verifyRoleSeparationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try { await requireAuthoritySeparationUser(); return apiSuccess(await verifyRoleSeparationRequest(request)); }
  catch (error) { return apiError(error, "Unable to verify authority role separation."); }
}
