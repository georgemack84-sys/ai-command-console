import { apiError, apiSuccess } from "@/src/server/api/response";
import { getViolationPatternContract, requireViolationPatternUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireViolationPatternUser();
    return apiSuccess(getViolationPatternContract());
  } catch (error) {
    return apiError(error, "Unable to load Violation Pattern contract.");
  }
}
