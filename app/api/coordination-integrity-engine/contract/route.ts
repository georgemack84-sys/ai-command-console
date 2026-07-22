import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireCoordinationIntegrityUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireCoordinationIntegrityUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load coordination integrity engine contract."); }
}
