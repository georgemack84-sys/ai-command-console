import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditRequest, requireSimulationValidationLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireSimulationValidationLedgerUser();
    return apiSuccess(await auditRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve simulation validation audit package.");
  }
}
