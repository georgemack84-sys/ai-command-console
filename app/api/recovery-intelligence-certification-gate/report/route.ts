import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportRequest, requireRecoveryCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecoveryCertificationUser();
    return apiSuccess(await reportRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load recovery intelligence certification report.");
  }
}
