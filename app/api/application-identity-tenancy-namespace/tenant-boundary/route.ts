import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireApplicationIdentityUser, tenantBoundaryRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationIdentityUser(); return apiSuccess(await tenantBoundaryRequest()); } catch (error) { return apiError(error, "Unable to inspect application tenant boundary."); } }
export async function POST(request: Request) { try { await requireApplicationIdentityUser(); return apiSuccess(await tenantBoundaryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application tenant boundary."); } }
