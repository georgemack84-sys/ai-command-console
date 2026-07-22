import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireDeterministicBehaviorUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDeterministicBehaviorUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve deterministic behavior contract."); } }
