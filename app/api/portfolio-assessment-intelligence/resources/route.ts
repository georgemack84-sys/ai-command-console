import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePortfolioAssessmentUser, resourcesRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePortfolioAssessmentUser(); return apiSuccess(await resourcesRequest()); } catch (error) { return apiError(error, "Unable to inspect portfolio resources."); } }
export async function POST(request: Request) { try { await requirePortfolioAssessmentUser(); return apiSuccess(await resourcesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect portfolio resources."); } }
