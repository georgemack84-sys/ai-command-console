import { apiError, apiSuccess } from "@/src/server/api/response";
import { causalChainRequest, requireHealthExplainabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireHealthExplainabilityUser();
    return apiSuccess(await causalChainRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load health causal chain.");
  }
}
