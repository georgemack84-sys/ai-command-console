import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireDeadlockRaceUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireDeadlockRaceUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect deadlock/race detection."); }
}
export async function POST(request: Request) {
  try { await requireDeadlockRaceUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect deadlock/race detection."); }
}
