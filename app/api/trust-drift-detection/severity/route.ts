import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustDriftUser, severityRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustDriftUser(); return apiSuccess(await severityRequest()); } catch (error) { return apiError(error, "Unable to load Trust Drift severity."); } }
export async function POST(request: Request) { try { await requireTrustDriftUser(); return apiSuccess(await severityRequest(request)); } catch (error) { return apiError(error, "Unable to compute Trust Drift severity."); } }
