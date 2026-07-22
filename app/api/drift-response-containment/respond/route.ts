import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDriftResponseUser, respondRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftResponseUser();
    return apiSuccess(await respondRequest(request));
  } catch (error) {
    return apiError(error, "Unable to respond to drift.");
  }
}
