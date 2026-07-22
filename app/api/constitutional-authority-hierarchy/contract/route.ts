import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAuthorityHierarchyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuthorityHierarchyUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect authority hierarchy contract."); } }
