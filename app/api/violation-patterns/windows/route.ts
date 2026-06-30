import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireViolationPatternUser } from "../core";
import { resolveComparisonWindow, resolveViolationPatternWindow } from "@/services/violation-patterns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireViolationPatternUser();
    const current = resolveViolationPatternWindow();
    return apiSuccess({ current, comparison: resolveComparisonWindow(current) });
  } catch (error) {
    return apiError(error, "Unable to resolve Violation Pattern windows.");
  }
}
