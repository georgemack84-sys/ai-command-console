import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireDeterministicDelegationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { await requireDeterministicDelegationUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load deterministic delegation assurance contract."); }
}
