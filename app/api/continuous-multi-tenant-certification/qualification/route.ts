import { qualificationRequest, requireContinuousMultiTenantCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousMultiTenantCertificationUser(); return apiSuccess(await qualificationRequest()); } catch (error) { return apiError(error, "Unable to read production qualification."); } }
export async function POST(request: Request) { try { await requireContinuousMultiTenantCertificationUser(); return apiSuccess(await qualificationRequest(request)); } catch (error) { return apiError(error, "Unable to read production qualification."); } }
