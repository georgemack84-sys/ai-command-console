import { apiError, apiSuccess } from "@/src/server/api/response";
import { recordsRequest, requireAutonomyCrossReferenceSearchUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomyCrossReferenceSearchUser(); return apiSuccess(await recordsRequest(request)); }
  catch (error) { return apiError(error, "Unable to load cross-reference records."); }
}
