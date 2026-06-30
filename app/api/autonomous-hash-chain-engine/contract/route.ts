import { apiError, apiSuccess } from "@/src/server/api/response";
import { getAutonomousHashChainResponse, requireAutonomousHashChainUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomousHashChainUser(); return apiSuccess(getAutonomousHashChainResponse()); }
  catch (error) { return apiError(error, "Unable to load Autonomous Hash Chain contract."); }
}
