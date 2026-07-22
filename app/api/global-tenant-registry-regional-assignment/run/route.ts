import { requireGlobalTenantRegistryRegionalAssignmentUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalTenantRegistryRegionalAssignmentUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Global Tenant Registry Regional Assignment."); } }
export async function POST(request: Request) { try { await requireGlobalTenantRegistryRegionalAssignmentUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Global Tenant Registry Regional Assignment."); } }
