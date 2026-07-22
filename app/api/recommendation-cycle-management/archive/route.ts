import { archiveRequest, requireRecommendationCycleUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationCycleUser(); return apiSuccess(await archiveRequest()); } catch (error) { return apiError(error, "Unable to inspect recommendation cycle archive."); } }
export async function POST(request: Request) { try { await requireRecommendationCycleUser(); return apiSuccess(await archiveRequest(request)); } catch (error) { return apiError(error, "Unable to archive recommendation cycle."); } }
