import { apiError, apiSuccess } from "@/src/server/api/response";
import { justificationRequest, requireTrustExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustExplainabilityUser(); return apiSuccess(await justificationRequest()); } catch (error) { return apiError(error, "Unable to load Trust Justification report."); } }
export async function POST(request: Request) { try { await requireTrustExplainabilityUser(); return apiSuccess(await justificationRequest(request)); } catch (error) { return apiError(error, "Unable to generate Trust Justification report."); } }
