import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectTaskClassificationRequest, requireTaskClassificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireTaskClassificationUser();
    return apiSuccess(await inspectTaskClassificationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Task Classification package.");
  }
}

export async function POST(request: Request) {
  try {
    await requireTaskClassificationUser();
    return apiSuccess(await inspectTaskClassificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Task Classification package.");
  }
}
