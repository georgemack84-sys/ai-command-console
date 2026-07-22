import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireConstitutionalBaselineUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireConstitutionalBaselineUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect constitutional baseline."); }
}
export async function POST(request: Request) {
  try { await requireConstitutionalBaselineUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect constitutional baseline."); }
}
