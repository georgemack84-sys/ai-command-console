import { requireContinuousMultiTenantCertificationUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousMultiTenantCertificationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Continuous Multi-Tenant Certification."); } }
export async function POST(request: Request) { try { await requireContinuousMultiTenantCertificationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Continuous Multi-Tenant Certification."); } }
