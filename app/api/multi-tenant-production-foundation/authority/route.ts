import { authorityRequest, requireMultiTenantProductionFoundationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireMultiTenantProductionFoundationUser(); return apiSuccess(await authorityRequest()); } catch (error) { return apiError(error, "Unable to load production foundation authority model."); } }
export async function POST(request: Request) { try { await requireMultiTenantProductionFoundationUser(); return apiSuccess(await authorityRequest(request)); } catch (error) { return apiError(error, "Unable to load production foundation authority model."); } }
