import { contractResponse, requireOperationalSafetyUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireOperationalSafetyUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Operational Safety contract."); } }
