import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerAutonomyStateRequest, requireAutonomyStateUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAutonomyStateUser();
    return apiSuccess(await ledgerAutonomyStateRequest());
  } catch (error) {
    return apiError(error, "Unable to retrieve autonomy transition ledger.");
  }
}
