import { apiError, apiSuccess } from "@/src/server/api/response";
import { decisionRequest, requireRecoveryValidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecoveryValidationUser();
    return apiSuccess(await decisionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load recovery validation decision.");
  }
}
