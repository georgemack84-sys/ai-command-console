import { apiError, apiSuccess } from "@/src/server/api/response";
import { registerEvidenceRequest, requireReasoningGraphUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireReasoningGraphUser();
    return apiSuccess(await registerEvidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to register reasoning graph evidence.");
  }
}
