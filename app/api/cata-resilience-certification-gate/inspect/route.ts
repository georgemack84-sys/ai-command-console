import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireCataResilienceCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireCataResilienceCertificationUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect CATA resilience certification."); }
}
export async function POST(request: Request) {
  try { await requireCataResilienceCertificationUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect CATA resilience certification."); }
}
