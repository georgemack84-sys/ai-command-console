import { alertsRequest, requireTrustDriftUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustDriftUser(); return apiSuccess(await alertsRequest()); } catch (error) { return apiError(error, "Unable to load Trust Drift alerts."); } }
export async function POST(request: Request) { try { await requireTrustDriftUser(); return apiSuccess(await alertsRequest(request)); } catch (error) { return apiError(error, "Unable to generate Trust Drift alerts."); } }
