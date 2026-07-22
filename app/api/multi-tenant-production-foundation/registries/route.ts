import { registriesRequest, requireMultiTenantProductionFoundationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireMultiTenantProductionFoundationUser(); return apiSuccess(await registriesRequest()); } catch (error) { return apiError(error, "Unable to load production foundation registries."); } }
export async function POST(request: Request) { try { await requireMultiTenantProductionFoundationUser(); return apiSuccess(await registriesRequest(request)); } catch (error) { return apiError(error, "Unable to load production foundation registries."); } }
