import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireCataResilienceCertificationUser, testsRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireCataResilienceCertificationUser(); return apiSuccess(await testsRequest(request)); }
  catch (error) { return apiError(error, "Unable to list CATA resilience certification tests."); }
}
