import { apiError, apiSuccess } from "@/src/server/api/response";
import { hierarchyRequest, requireAuthorityHierarchyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuthorityHierarchyUser(); return apiSuccess(await hierarchyRequest()); } catch (error) { return apiError(error, "Unable to inspect authority hierarchy."); } }
export async function POST(request: Request) { try { await requireAuthorityHierarchyUser(); return apiSuccess(await hierarchyRequest(request)); } catch (error) { return apiError(error, "Unable to inspect authority hierarchy."); } }
