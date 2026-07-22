import { apiError, apiSuccess } from "@/src/server/api/response";
import { executionRequest, requireReplayIntegrityExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireReplayIntegrityExplainabilityUser(); return apiSuccess(await executionRequest()); } catch (error) { return apiError(error, "Unable to load replay execution."); } }
export async function POST(request: Request) { try { await requireReplayIntegrityExplainabilityUser(); return apiSuccess(await executionRequest(request)); } catch (error) { return apiError(error, "Unable to load replay execution."); } }
