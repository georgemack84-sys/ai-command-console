import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireLearningAdaptationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireLearningAdaptationUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF adaptation evidence."); } }
export async function POST(request: Request) { try { await requireLearningAdaptationUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF adaptation evidence."); } }
