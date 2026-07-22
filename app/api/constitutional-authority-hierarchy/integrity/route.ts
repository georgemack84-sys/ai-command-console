import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityRequest, requireAuthorityHierarchyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuthorityHierarchyUser(); return apiSuccess(await integrityRequest()); } catch (error) { return apiError(error, "Unable to validate authority integrity."); } }
export async function POST(request: Request) { try { await requireAuthorityHierarchyUser(); return apiSuccess(await integrityRequest(request)); } catch (error) { return apiError(error, "Unable to validate authority integrity."); } }
