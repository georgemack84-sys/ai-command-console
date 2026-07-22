import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireConfidenceDriftUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireConfidenceDriftUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence drift contract.");
  }
}
