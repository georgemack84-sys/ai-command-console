import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayViolationPatternRequest, requireViolationPatternUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireViolationPatternUser();
    return apiSuccess(await replayViolationPatternRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Violation Pattern record.");
  }
}
