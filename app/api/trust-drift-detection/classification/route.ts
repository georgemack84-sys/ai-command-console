import { apiError, apiSuccess } from "@/src/server/api/response";
import { classificationRequest, requireTrustDriftUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustDriftUser(); return apiSuccess(await classificationRequest()); } catch (error) { return apiError(error, "Unable to load Trust Drift classification."); } }
export async function POST(request: Request) { try { await requireTrustDriftUser(); return apiSuccess(await classificationRequest(request)); } catch (error) { return apiError(error, "Unable to classify Trust Drift."); } }
