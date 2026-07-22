import { certificationRequest, requireTenantProvisioningLifecycleUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireTenantProvisioningLifecycleUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load tenant lifecycle certification."); } }
export async function POST(request: Request) { try { await requireTenantProvisioningLifecycleUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load tenant lifecycle certification."); } }
