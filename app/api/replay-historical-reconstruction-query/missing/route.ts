import { apiError, apiSuccess } from "@/src/server/api/response";
import { missingRecordsRequest, requireReplayHistoricalReconstructionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReplayHistoricalReconstructionUser(); return apiSuccess(await missingRecordsRequest(request)); }
  catch (error) { return apiError(error, "Unable to load missing historical records."); }
}
