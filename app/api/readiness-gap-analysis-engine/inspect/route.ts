import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireReadinessGapUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireReadinessGapUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect readiness gap analysis engine."); }
}
export async function POST(request: Request) {
  try { await requireReadinessGapUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect readiness gap analysis engine."); }
}
