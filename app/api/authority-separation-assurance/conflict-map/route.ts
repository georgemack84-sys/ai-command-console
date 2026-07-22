import { apiError, apiSuccess } from "@/src/server/api/response";
import { conflictMapRequest, requireAuthoritySeparationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try { await requireAuthoritySeparationUser(); return apiSuccess(await conflictMapRequest(request)); }
  catch (error) { return apiError(error, "Unable to generate authority conflict map."); }
}
