import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerAutonomyAuthorityRequest, requireAutonomyAuthorityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAutonomyAuthorityUser();
    return apiSuccess(await ledgerAutonomyAuthorityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve autonomy authority ledger.");
  }
}
