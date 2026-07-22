import { authorityRequest, requireGlobalTenantRegistryRegionalAssignmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalTenantRegistryRegionalAssignmentUser(); return apiSuccess(await authorityRequest()); } catch (error) { return apiError(error, "Unable to load assignment authority validation."); } }
export async function POST(request: Request) { try { await requireGlobalTenantRegistryRegionalAssignmentUser(); return apiSuccess(await authorityRequest(request)); } catch (error) { return apiError(error, "Unable to load assignment authority validation."); } }
