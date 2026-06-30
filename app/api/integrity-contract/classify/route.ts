import { apiError, apiSuccess } from "@/src/server/api/response";
import { classifyIntegrityRequest, requireIntegrityContractUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireIntegrityContractUser(); return apiSuccess(await classifyIntegrityRequest(request)); }
  catch (error) { return apiError(error, "Unable to classify integrity failure."); }
}
