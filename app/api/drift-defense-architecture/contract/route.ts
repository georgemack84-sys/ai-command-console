import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireDriftDefenseUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDriftDefenseUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve drift defense architecture contract.");
  }
}
