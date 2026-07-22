import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireContinuousConstitutionalUser, resultRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireContinuousConstitutionalUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect continuous constitutional validation."); }
}
export async function POST(request: Request) {
  try { await requireContinuousConstitutionalUser(); return apiSuccess(await resultRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect continuous constitutional validation."); }
}
