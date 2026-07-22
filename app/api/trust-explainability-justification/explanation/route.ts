import { apiError, apiSuccess } from "@/src/server/api/response";
import { explanationRequest, requireTrustExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustExplainabilityUser(); return apiSuccess(await explanationRequest()); } catch (error) { return apiError(error, "Unable to load Trust Explanation."); } }
export async function POST(request: Request) { try { await requireTrustExplainabilityUser(); return apiSuccess(await explanationRequest(request)); } catch (error) { return apiError(error, "Unable to build Trust Explanation."); } }
