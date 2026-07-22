import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceChainRequest, requireReasoningGraphUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireReasoningGraphUser();
    return apiSuccess(await evidenceChainRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build evidence chain.");
  }
}
