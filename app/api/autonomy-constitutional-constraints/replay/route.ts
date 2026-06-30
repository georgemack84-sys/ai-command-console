import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayConstitutionalValidationRequest, requireConstitutionalConstraintsUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConstitutionalConstraintsUser();
    return apiSuccess(await replayConstitutionalValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay constitutional decisions.");
  }
}
