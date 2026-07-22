import { requireMultiTenantProductionFoundationUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireMultiTenantProductionFoundationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Multi-Tenant Production Foundation."); } }
export async function POST(request: Request) { try { await requireMultiTenantProductionFoundationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Multi-Tenant Production Foundation."); } }
