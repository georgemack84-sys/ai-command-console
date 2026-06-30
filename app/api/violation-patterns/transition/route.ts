import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireViolationPatternUser, transitionViolationPatternRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireViolationPatternUser();
    return apiSuccess(await transitionViolationPatternRequest(request));
  } catch (error) {
    return apiError(error, "Unable to transition Violation Pattern record.");
  }
}
