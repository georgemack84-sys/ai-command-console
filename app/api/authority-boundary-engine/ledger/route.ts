import { apiError, apiSuccess } from "@/src/server/api/response";
import { authorityBoundaryLedgerRequest, requireAuthorityBoundaryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAuthorityBoundaryUser();
    return apiSuccess(await authorityBoundaryLedgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve Authority Boundary ledger entry.");
  }
}
