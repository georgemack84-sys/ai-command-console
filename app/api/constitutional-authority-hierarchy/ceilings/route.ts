import { apiError, apiSuccess } from "@/src/server/api/response";
import { ceilingsRequest, requireAuthorityHierarchyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuthorityHierarchyUser(); return apiSuccess(await ceilingsRequest()); } catch (error) { return apiError(error, "Unable to validate authority ceilings."); } }
export async function POST(request: Request) { try { await requireAuthorityHierarchyUser(); return apiSuccess(await ceilingsRequest(request)); } catch (error) { return apiError(error, "Unable to validate authority ceilings."); } }
