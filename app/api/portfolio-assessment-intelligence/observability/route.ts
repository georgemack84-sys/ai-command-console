import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requirePortfolioAssessmentUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePortfolioAssessmentUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to inspect portfolio observability."); } }
export async function POST(request: Request) { try { await requirePortfolioAssessmentUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect portfolio observability."); } }
