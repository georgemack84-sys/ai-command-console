import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationBundleResponse, certifyRequest, requireAutonomyMaturityCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomyMaturityCertificationUser(); return apiSuccess(certificationBundleResponse()); }
  catch (error) { return apiError(error, "Unable to load autonomy maturity certification gate."); }
}
export async function POST(request: Request) {
  try { await requireAutonomyMaturityCertificationUser(); return apiSuccess(await certifyRequest(request)); }
  catch (error) { return apiError(error, "Unable to certify autonomy maturity framework."); }
}
