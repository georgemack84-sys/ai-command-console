import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportRequest, requireTrustExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustExplainabilityUser(); return apiSuccess(await reportRequest()); } catch (error) { return apiError(error, "Unable to load Trust Explainability report."); } }
export async function POST(request: Request) { try { await requireTrustExplainabilityUser(); return apiSuccess(await reportRequest(request)); } catch (error) { return apiError(error, "Unable to generate Trust Explainability report."); } }
