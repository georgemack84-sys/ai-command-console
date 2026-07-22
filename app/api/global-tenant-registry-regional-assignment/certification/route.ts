import { certificationRequest, requireGlobalTenantRegistryRegionalAssignmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalTenantRegistryRegionalAssignmentUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load registry assignment certification."); } }
export async function POST(request: Request) { try { await requireGlobalTenantRegistryRegionalAssignmentUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load registry assignment certification."); } }
