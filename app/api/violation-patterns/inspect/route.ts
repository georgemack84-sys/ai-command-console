import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectViolationPatternRequest, requireViolationPatternUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireViolationPatternUser();
    return apiSuccess(await inspectViolationPatternRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Violation Pattern record.");
  }
}

export async function POST(request: Request) {
  try {
    await requireViolationPatternUser();
    return apiSuccess(await inspectViolationPatternRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Violation Pattern record.");
  }
}
