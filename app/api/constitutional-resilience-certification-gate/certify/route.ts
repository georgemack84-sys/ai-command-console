import { apiError, apiSuccess } from "@/src/server/api/response";
import { certifyRequest, contractResponse, requireConstitutionalCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireConstitutionalCertificationUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load constitutional resilience certification gate."); }
}
export async function POST(request: Request) {
  try { await requireConstitutionalCertificationUser(); return apiSuccess(await certifyRequest(request)); }
  catch (error) { return apiError(error, "Unable to certify constitutional resilience framework."); }
}
