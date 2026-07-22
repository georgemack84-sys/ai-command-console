import { apiError, apiSuccess } from "@/src/server/api/response";
import { detectRaceWindowsRequest, requireDeadlockRaceUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireDeadlockRaceUser(); return apiSuccess(await detectRaceWindowsRequest(request)); }
  catch (error) { return apiError(error, "Unable to detect race windows."); }
}
