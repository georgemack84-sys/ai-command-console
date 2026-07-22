import { contractResponse, requireMultiTenantProductionFoundationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireMultiTenantProductionFoundationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Multi-Tenant Production Foundation contract."); } }
