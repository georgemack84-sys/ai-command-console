import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireSharedGovernanceUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireSharedGovernanceUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load shared governance assurance contract."); }
}
