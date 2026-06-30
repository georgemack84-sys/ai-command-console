import { apiError, apiSuccess } from "@/src/server/api/response";
import { decideConstitutionalValidationRequest, requireConstitutionalConstraintsUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConstitutionalConstraintsUser();
    return apiSuccess(await decideConstitutionalValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to decide constitutional validation.");
  }
}
