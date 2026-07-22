import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationBundleResponse, certifyRequest, requireCataResilienceCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireCataResilienceCertificationUser(); return apiSuccess(certificationBundleResponse()); }
  catch (error) { return apiError(error, "Unable to load CATA resilience certification gate."); }
}
export async function POST(request: Request) {
  try { await requireCataResilienceCertificationUser(); return apiSuccess(await certifyRequest(request)); }
  catch (error) { return apiError(error, "Unable to certify CATA resilience platform."); }
}
