import { apiError, apiSuccess } from "@/src/server/api/response";
import { detectViolationPatternRequest, requireViolationPatternUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireViolationPatternUser();
    return apiSuccess(await detectViolationPatternRequest(request));
  } catch (error) {
    return apiError(error, "Unable to detect Violation Patterns.");
  }
}
