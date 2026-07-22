import { certificationRequest, requireRecommendationCycleUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationCycleUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to inspect recommendation cycle certification."); } }
export async function POST(request: Request) { try { await requireRecommendationCycleUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect recommendation cycle certification."); } }
