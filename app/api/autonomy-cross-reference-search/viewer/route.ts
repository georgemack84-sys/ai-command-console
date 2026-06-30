import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAutonomyCrossReferenceSearchUser, viewerRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomyCrossReferenceSearchUser(); return apiSuccess(await viewerRequest(request)); }
  catch (error) { return apiError(error, "Unable to load cross-ledger search viewer."); }
}
