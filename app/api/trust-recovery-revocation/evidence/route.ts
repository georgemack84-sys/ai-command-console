import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireTrustRecoveryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRecoveryUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to load Trust Restoration evidence."); } }
export async function POST(request: Request) { try { await requireTrustRecoveryUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Restoration evidence."); } }
