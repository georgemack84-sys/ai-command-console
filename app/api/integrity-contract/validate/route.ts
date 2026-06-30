import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireIntegrityContractUser, validateIntegrityRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireIntegrityContractUser(); return apiSuccess(await validateIntegrityRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate integrity contract."); }
}
