import { apiError, apiSuccess } from "@/src/server/api/response";
import { divergenceRequest, requireReplayIntegrityExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireReplayIntegrityExplainabilityUser(); return apiSuccess(await divergenceRequest()); } catch (error) { return apiError(error, "Unable to load replay divergence."); } }
export async function POST(request: Request) { try { await requireReplayIntegrityExplainabilityUser(); return apiSuccess(await divergenceRequest(request)); } catch (error) { return apiError(error, "Unable to load replay divergence."); } }
