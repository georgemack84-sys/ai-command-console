import { apiError, apiSuccess } from "@/src/server/api/response";
import { lifecycleIntegrityRequest, requireIntegrityContractUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireIntegrityContractUser(); return apiSuccess(await lifecycleIntegrityRequest(request)); }
  catch (error) { return apiError(error, "Unable to transition integrity lifecycle."); }
}
