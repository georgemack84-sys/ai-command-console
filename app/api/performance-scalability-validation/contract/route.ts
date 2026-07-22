import { contractResponse, requirePerformanceScalabilityValidationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePerformanceScalabilityValidationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Performance Scalability Validation contract."); } }
