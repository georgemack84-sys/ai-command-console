import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityRequest, requireReplayIntegrityExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireReplayIntegrityExplainabilityUser(); return apiSuccess(await integrityRequest()); } catch (error) { return apiError(error, "Unable to load replay integrity."); } }
export async function POST(request: Request) { try { await requireReplayIntegrityExplainabilityUser(); return apiSuccess(await integrityRequest(request)); } catch (error) { return apiError(error, "Unable to load replay integrity."); } }
