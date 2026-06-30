import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectAutonomySearchRequest, requireAutonomySearchUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomySearchUser(); return apiSuccess(await inspectAutonomySearchRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Autonomy Search."); }
}
export async function POST(request: Request) {
  try { await requireAutonomySearchUser(); return apiSuccess(await inspectAutonomySearchRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect Autonomy Search."); }
}
