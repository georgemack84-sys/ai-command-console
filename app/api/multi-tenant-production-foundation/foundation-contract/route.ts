import { contractRequest, requireMultiTenantProductionFoundationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireMultiTenantProductionFoundationUser(); return apiSuccess(await contractRequest()); } catch (error) { return apiError(error, "Unable to load production foundation contract."); } }
export async function POST(request: Request) { try { await requireMultiTenantProductionFoundationUser(); return apiSuccess(await contractRequest(request)); } catch (error) { return apiError(error, "Unable to load production foundation contract."); } }
