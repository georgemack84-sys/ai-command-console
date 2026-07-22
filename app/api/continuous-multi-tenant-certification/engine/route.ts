import { engineRequest, requireContinuousMultiTenantCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousMultiTenantCertificationUser(); return apiSuccess(await engineRequest()); } catch (error) { return apiError(error, "Unable to read continuous certification engine."); } }
export async function POST(request: Request) { try { await requireContinuousMultiTenantCertificationUser(); return apiSuccess(await engineRequest(request)); } catch (error) { return apiError(error, "Unable to read continuous certification engine."); } }
