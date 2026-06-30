import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAutonomyCrossReferenceSearchUser, resolverRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomyCrossReferenceSearchUser(); return apiSuccess(await resolverRequest(request)); }
  catch (error) { return apiError(error, "Unable to resolve cross-reference records."); }
}
