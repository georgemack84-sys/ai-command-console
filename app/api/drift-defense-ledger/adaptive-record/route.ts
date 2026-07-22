import { adaptiveRecordRequest, requireDriftLedgerUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftLedgerUser();
    return apiSuccess(await adaptiveRecordRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive drift record.");
  }
}
