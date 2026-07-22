import { qualificationRequest, requireTenantProvisioningLifecycleUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireTenantProvisioningLifecycleUser(); return apiSuccess(await qualificationRequest()); } catch (error) { return apiError(error, "Unable to load tenant qualification details."); } }
export async function POST(request: Request) { try { await requireTenantProvisioningLifecycleUser(); return apiSuccess(await qualificationRequest(request)); } catch (error) { return apiError(error, "Unable to load tenant qualification details."); } }
