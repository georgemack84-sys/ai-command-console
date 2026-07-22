import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptiveSafetyUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireAdaptiveSafetyUser(); return apiSuccess(await sectionRequest(request, "hidden_learning_detection")); } catch (error) { return apiError(error, "Unable to retrieve hidden learning detection."); } }
