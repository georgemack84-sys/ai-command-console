import { contractResponse, requireAdaptationQualificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationQualificationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Adaptation Qualification Service contract."); } }
