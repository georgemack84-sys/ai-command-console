import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceIntegrityCertificationRequest, requireIntegrityCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireIntegrityCertificationUser(); return apiSuccess(await evidenceIntegrityCertificationRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Integrity Certification evidence."); }
}
