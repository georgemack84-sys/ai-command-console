import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustRecoveryUser, revocationRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRecoveryUser(); return apiSuccess(await revocationRequest()); } catch (error) { return apiError(error, "Unable to load Trust Revocation record."); } }
export async function POST(request: Request) { try { await requireTrustRecoveryUser(); return apiSuccess(await revocationRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Revocation record."); } }
