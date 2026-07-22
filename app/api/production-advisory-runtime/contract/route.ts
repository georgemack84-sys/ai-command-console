import { contractResponse, requireProductionAdvisoryRuntimeUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Production Advisory Runtime contract."); } }
