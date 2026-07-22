import { apiError, apiSuccess } from "@/src/server/api/response";
import { packageRequest, requireTrustEvaluationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvaluationUser(); return apiSuccess(await packageRequest()); } catch (error) { return apiError(error, "Unable to inspect evaluation evidence package."); } }
export async function POST(request: Request) { try { await requireTrustEvaluationUser(); return apiSuccess(await packageRequest(request)); } catch (error) { return apiError(error, "Unable to project evaluation evidence package."); } }
