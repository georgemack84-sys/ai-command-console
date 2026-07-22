import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireTrustDriftUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustDriftUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to load Trust Drift Detection readiness."); } }
export async function POST(request: Request) { try { await requireTrustDriftUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Drift Detection readiness."); } }
