import { apiError, apiSuccess } from "@/src/server/api/response";
import { advisoryRequest, requireAuthorityHierarchyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuthorityHierarchyUser(); return apiSuccess(await advisoryRequest()); } catch (error) { return apiError(error, "Unable to enforce advisory boundary."); } }
export async function POST(request: Request) { try { await requireAuthorityHierarchyUser(); return apiSuccess(await advisoryRequest(request)); } catch (error) { return apiError(error, "Unable to enforce advisory boundary."); } }
