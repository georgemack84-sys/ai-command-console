import { apiError, apiSuccess } from "@/src/server/api/response";
import { boundedRequest, requireLearningAdaptationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireLearningAdaptationUser(); return apiSuccess(await boundedRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF bounded improvement."); } }
export async function POST(request: Request) { try { await requireLearningAdaptationUser(); return apiSuccess(await boundedRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF bounded improvement."); } }
