import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustDriftUser, trendsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustDriftUser(); return apiSuccess(await trendsRequest()); } catch (error) { return apiError(error, "Unable to load Trust Drift trends."); } }
export async function POST(request: Request) { try { await requireTrustDriftUser(); return apiSuccess(await trendsRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Drift trends."); } }
