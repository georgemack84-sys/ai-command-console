import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireSyntheticIdentityDataGenerationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load synthetic identity data generation contract."); } }
