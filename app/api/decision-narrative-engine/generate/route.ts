import { apiError, apiSuccess } from "@/src/server/api/response";
import { generateRequest, requireDecisionNarrativeUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDecisionNarrativeUser();
    return apiSuccess(await generateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate decision narrative.");
  }
}
