import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectAutonomousHashChainRequest, requireAutonomousHashChainUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomousHashChainUser(); return apiSuccess(await inspectAutonomousHashChainRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Autonomous Hash Chain."); }
}
export async function POST(request: Request) {
  try { await requireAutonomousHashChainUser(); return apiSuccess(await inspectAutonomousHashChainRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect Autonomous Hash Chain."); }
}
