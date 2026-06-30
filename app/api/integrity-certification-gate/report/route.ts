import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportIntegrityCertificationRequest, requireIntegrityCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireIntegrityCertificationUser(); return apiSuccess(await reportIntegrityCertificationRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Integrity Certification report."); }
}
