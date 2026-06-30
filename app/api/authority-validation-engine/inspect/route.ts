import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectAuthorityValidationRequest, requireAuthorityValidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuthorityValidationUser();
    return apiSuccess(await inspectAuthorityValidationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Authority Validation package.");
  }
}

export async function POST(request: Request) {
  try {
    await requireAuthorityValidationUser();
    return apiSuccess(await inspectAuthorityValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Authority Validation package.");
  }
}
