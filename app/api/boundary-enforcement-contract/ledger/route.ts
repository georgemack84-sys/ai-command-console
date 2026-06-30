import { apiError, apiSuccess } from "@/src/server/api/response";
import { boundaryEnforcementLedgerRequest, requireBoundaryEnforcementUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireBoundaryEnforcementUser();
    return apiSuccess(await boundaryEnforcementLedgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve Boundary Enforcement ledger entry.");
  }
}
