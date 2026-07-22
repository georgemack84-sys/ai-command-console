import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireReplayConsistencyUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireReplayConsistencyUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect replay consistency assurance."); }
}
export async function POST(request: Request) {
  try { await requireReplayConsistencyUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect replay consistency assurance."); }
}
