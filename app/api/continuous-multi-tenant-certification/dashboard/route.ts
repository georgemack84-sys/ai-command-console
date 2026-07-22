import { dashboardRequest, requireContinuousMultiTenantCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousMultiTenantCertificationUser(); return apiSuccess(await dashboardRequest()); } catch (error) { return apiError(error, "Unable to read certification dashboard."); } }
export async function POST(request: Request) { try { await requireContinuousMultiTenantCertificationUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to read certification dashboard."); } }
