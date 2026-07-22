import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustExplainabilityUser, traceRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustExplainabilityUser(); return apiSuccess(await traceRequest()); } catch (error) { return apiError(error, "Unable to load Trust Explanation trace."); } }
export async function POST(request: Request) { try { await requireTrustExplainabilityUser(); return apiSuccess(await traceRequest(request)); } catch (error) { return apiError(error, "Unable to trace Trust Explanation evidence."); } }
