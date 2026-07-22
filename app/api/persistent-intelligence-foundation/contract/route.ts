import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requirePersistentIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePersistentIntelligenceUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve persistent intelligence foundation contract.");
  }
}
