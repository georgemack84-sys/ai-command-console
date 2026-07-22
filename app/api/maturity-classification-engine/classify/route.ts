import { apiError, apiSuccess } from "@/src/server/api/response";
import { classificationBundleResponse, classifyRequest, requireMaturityClassificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireMaturityClassificationUser(); return apiSuccess(classificationBundleResponse()); }
  catch (error) { return apiError(error, "Unable to load maturity classification engine."); }
}
export async function POST(request: Request) {
  try { await requireMaturityClassificationUser(); return apiSuccess(await classifyRequest(request)); }
  catch (error) { return apiError(error, "Unable to classify maturity."); }
}
