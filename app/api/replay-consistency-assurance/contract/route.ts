import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireReplayConsistencyUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireReplayConsistencyUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load replay consistency assurance contract."); }
}
