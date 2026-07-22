import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustRecoveryUser, suspensionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRecoveryUser(); return apiSuccess(await suspensionRequest()); } catch (error) { return apiError(error, "Unable to load Trust Suspension record."); } }
export async function POST(request: Request) { try { await requireTrustRecoveryUser(); return apiSuccess(await suspensionRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Suspension record."); } }
