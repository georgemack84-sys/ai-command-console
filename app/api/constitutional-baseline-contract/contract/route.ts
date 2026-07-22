import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractRequest, contractResponse, requireConstitutionalBaselineUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireConstitutionalBaselineUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load constitutional baseline contract."); }
}
export async function POST(request: Request) {
  try { await requireConstitutionalBaselineUser(); return apiSuccess(await contractRequest(request)); }
  catch (error) { return apiError(error, "Unable to build constitutional baseline contract."); }
}
