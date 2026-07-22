import { provisioningRequest, requireTenantProvisioningLifecycleUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireTenantProvisioningLifecycleUser(); return apiSuccess(await provisioningRequest()); } catch (error) { return apiError(error, "Unable to load tenant provisioning details."); } }
export async function POST(request: Request) { try { await requireTenantProvisioningLifecycleUser(); return apiSuccess(await provisioningRequest(request)); } catch (error) { return apiError(error, "Unable to load tenant provisioning details."); } }
