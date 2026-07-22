import { requirePerformanceScalabilityValidationUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePerformanceScalabilityValidationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Performance Scalability Validation."); } }
export async function POST(request: Request) { try { await requirePerformanceScalabilityValidationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Performance Scalability Validation."); } }
