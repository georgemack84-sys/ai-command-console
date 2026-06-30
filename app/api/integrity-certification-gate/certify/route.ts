import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireIntegrityCertificationUser, runIntegrityCertificationRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireIntegrityCertificationUser(); return apiSuccess(await runIntegrityCertificationRequest(request)); }
  catch (error) { return apiError(error, "Unable to run Integrity Certification."); }
}
