import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireTrustExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustExplainabilityUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to load Trust Explainability readiness."); } }
export async function POST(request: Request) { try { await requireTrustExplainabilityUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Explainability readiness."); } }
