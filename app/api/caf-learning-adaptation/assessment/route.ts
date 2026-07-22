import { apiError, apiSuccess } from "@/src/server/api/response";
import { assessmentRequest, requireLearningAdaptationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireLearningAdaptationUser(); return apiSuccess(await assessmentRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF adaptation assessment."); } }
export async function POST(request: Request) { try { await requireLearningAdaptationUser(); return apiSuccess(await assessmentRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF adaptation assessment."); } }
