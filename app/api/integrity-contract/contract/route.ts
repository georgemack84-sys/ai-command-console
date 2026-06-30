import { apiError, apiSuccess } from "@/src/server/api/response";
import { getIntegrityContractResponse, requireIntegrityContractUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireIntegrityContractUser(); return apiSuccess(getIntegrityContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Integrity Contract."); }
}
