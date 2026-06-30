import { apiError, apiSuccess } from "@/src/server/api/response";
import { packageTaskClassificationRequest, requireTaskClassificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireTaskClassificationUser();
    return apiSuccess(await packageTaskClassificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build Task Classification package.");
  }
}
