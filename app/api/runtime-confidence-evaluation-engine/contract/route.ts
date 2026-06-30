import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireRuntimeConfidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRuntimeConfidenceUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load runtime confidence contract.");
  }
}
