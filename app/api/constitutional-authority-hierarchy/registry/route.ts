import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireAuthorityHierarchyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuthorityHierarchyUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to inspect authority registry."); } }
export async function POST(request: Request) { try { await requireAuthorityHierarchyUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect authority registry."); } }
