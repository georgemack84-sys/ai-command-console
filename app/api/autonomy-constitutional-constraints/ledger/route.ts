import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerConstitutionalValidationRequest, requireConstitutionalConstraintsUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConstitutionalConstraintsUser();
    return apiSuccess(await ledgerConstitutionalValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build constitutional decision ledger.");
  }
}
