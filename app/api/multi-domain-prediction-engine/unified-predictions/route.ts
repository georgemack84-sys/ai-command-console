import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMultiDomainUser, unifiedPredictionsRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMultiDomainUser();
    return apiSuccess(await unifiedPredictionsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load unified multi-domain predictions.");
  }
}
