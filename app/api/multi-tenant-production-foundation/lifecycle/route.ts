import { lifecycleRequest, requireMultiTenantProductionFoundationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireMultiTenantProductionFoundationUser(); return apiSuccess(await lifecycleRequest()); } catch (error) { return apiError(error, "Unable to load production scaling lifecycle."); } }
export async function POST(request: Request) { try { await requireMultiTenantProductionFoundationUser(); return apiSuccess(await lifecycleRequest(request)); } catch (error) { return apiError(error, "Unable to load production scaling lifecycle."); } }
