import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePortfolioAssessmentUser, scenariosRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePortfolioAssessmentUser(); return apiSuccess(await scenariosRequest()); } catch (error) { return apiError(error, "Unable to inspect portfolio scenario assessment."); } }
export async function POST(request: Request) { try { await requirePortfolioAssessmentUser(); return apiSuccess(await scenariosRequest(request)); } catch (error) { return apiError(error, "Unable to inspect portfolio scenario assessment."); } }
