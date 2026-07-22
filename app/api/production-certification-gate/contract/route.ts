import { contractResponse, requireProductionCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionCertificationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Production Certification Gate contract."); } }
