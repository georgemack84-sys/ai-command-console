import { certificationRequest, requireMultiTenantProductionFoundationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireMultiTenantProductionFoundationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load production foundation certification."); } }
export async function POST(request: Request) { try { await requireMultiTenantProductionFoundationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load production foundation certification."); } }
