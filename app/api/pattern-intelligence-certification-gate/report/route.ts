import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportRequest, requirePatternCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternCertificationUser();
    return apiSuccess(await reportRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate pattern intelligence certification report.");
  }
}
