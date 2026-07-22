import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdversarialTestingUser, validationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdversarialTestingUser();
    return apiSuccess(await validationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve defensive validation.");
  }
}
