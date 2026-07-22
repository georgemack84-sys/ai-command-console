import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, executeRequest, requireCoordinationCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireCoordinationCertificationUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load coordination assurance certification gate."); }
}
export async function POST(request: Request) {
  try { await requireCoordinationCertificationUser(); return apiSuccess(await executeRequest(request)); }
  catch (error) { return apiError(error, "Unable to execute coordination assurance certification gate."); }
}
