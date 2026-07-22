import { contractResponse, requireContinuousAssuranceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousAssuranceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Continuous Assurance contract."); } }
