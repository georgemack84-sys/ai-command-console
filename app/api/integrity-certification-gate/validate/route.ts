import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireIntegrityCertificationUser, validateIntegrityCertificationRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireIntegrityCertificationUser(); return apiSuccess(await validateIntegrityCertificationRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate Integrity Certification report."); }
}
