import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectIntegrityCertificationRequest, requireIntegrityCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireIntegrityCertificationUser(); return apiSuccess(await inspectIntegrityCertificationRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Integrity Certification."); }
}
export async function POST(request: Request) {
  try { await requireIntegrityCertificationUser(); return apiSuccess(await inspectIntegrityCertificationRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect Integrity Certification."); }
}
