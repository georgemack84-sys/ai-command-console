import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireProgressiveDeliveryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgressiveDeliveryUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load progressive delivery contract."); } }
