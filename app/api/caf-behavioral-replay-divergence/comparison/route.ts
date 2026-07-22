import { apiError, apiSuccess } from "@/src/server/api/response";
import { comparisonRequest, requireBehavioralReplayDivergenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireBehavioralReplayDivergenceUser(); return apiSuccess(await comparisonRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF behavioral comparison."); } }
export async function POST(request: Request) { try { await requireBehavioralReplayDivergenceUser(); return apiSuccess(await comparisonRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF behavioral comparison."); } }
