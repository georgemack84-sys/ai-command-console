import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportRequest, requireConfidenceDriftUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceDriftUser();
    return apiSuccess(await reportRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence drift report.");
  }
}
