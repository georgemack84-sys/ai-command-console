import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireViolationPatternUser, validateViolationPatternRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireViolationPatternUser();
    return apiSuccess(await validateViolationPatternRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Violation Pattern record.");
  }
}
