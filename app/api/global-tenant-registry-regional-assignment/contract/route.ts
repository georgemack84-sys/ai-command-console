import { contractResponse, requireGlobalTenantRegistryRegionalAssignmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalTenantRegistryRegionalAssignmentUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Global Tenant Registry Regional Assignment contract."); } }
