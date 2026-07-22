import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requirePatternMemoryRegistryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePatternMemoryRegistryUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve pattern memory registry contract.");
  }
}
