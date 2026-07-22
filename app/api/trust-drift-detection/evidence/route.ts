import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireTrustDriftUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustDriftUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to load Trust Drift evidence."); } }
export async function POST(request: Request) { try { await requireTrustDriftUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Drift evidence."); } }
