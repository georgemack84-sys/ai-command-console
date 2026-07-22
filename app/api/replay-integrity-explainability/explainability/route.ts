import { apiError, apiSuccess } from "@/src/server/api/response";
import { explainabilityRequest, requireReplayIntegrityExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireReplayIntegrityExplainabilityUser(); return apiSuccess(await explainabilityRequest()); } catch (error) { return apiError(error, "Unable to load replay explainability."); } }
export async function POST(request: Request) { try { await requireReplayIntegrityExplainabilityUser(); return apiSuccess(await explainabilityRequest(request)); } catch (error) { return apiError(error, "Unable to load replay explainability."); } }
