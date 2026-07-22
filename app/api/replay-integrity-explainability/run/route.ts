import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireReplayIntegrityExplainabilityUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireReplayIntegrityExplainabilityUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run replay integrity explainability."); } }
export async function POST(request: Request) { try { await requireReplayIntegrityExplainabilityUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run replay integrity explainability."); } }
