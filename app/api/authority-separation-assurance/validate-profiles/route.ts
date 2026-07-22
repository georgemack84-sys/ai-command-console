import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAuthoritySeparationUser, validateProfilesRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try { await requireAuthoritySeparationUser(); return apiSuccess(await validateProfilesRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate authority profiles."); }
}
