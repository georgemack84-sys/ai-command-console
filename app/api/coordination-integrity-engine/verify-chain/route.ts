import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireCoordinationIntegrityUser, verifyChainRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireCoordinationIntegrityUser(); return apiSuccess(await verifyChainRequest(request)); }
  catch (error) { return apiError(error, "Unable to verify coordination integrity hash chain."); }
}
