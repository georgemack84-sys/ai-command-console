import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayAuditRequest, requireDriftDefenseCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftDefenseCertificationUser();
    return apiSuccess(await replayAuditRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve replay audit certification.");
  }
}
