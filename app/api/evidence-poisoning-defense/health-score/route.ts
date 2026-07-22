import { apiError, apiSuccess } from "@/src/server/api/response";
import { healthScoreRequest, requireEvidencePoisoningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEvidencePoisoningUser();
    return apiSuccess(await healthScoreRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve evidence health score.");
  }
}
