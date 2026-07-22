import { contractResponse, requireContinuousMultiTenantCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousMultiTenantCertificationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Continuous Multi-Tenant Certification contract."); } }
