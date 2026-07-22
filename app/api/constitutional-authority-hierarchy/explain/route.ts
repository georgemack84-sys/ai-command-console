import { apiError, apiSuccess } from "@/src/server/api/response";
import { explainRequest, requireAuthorityHierarchyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuthorityHierarchyUser(); return apiSuccess(await explainRequest()); } catch (error) { return apiError(error, "Unable to explain authority hierarchy."); } }
export async function POST(request: Request) { try { await requireAuthorityHierarchyUser(); return apiSuccess(await explainRequest(request)); } catch (error) { return apiError(error, "Unable to explain authority hierarchy."); } }
