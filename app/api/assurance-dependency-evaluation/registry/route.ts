import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireAssuranceDependencyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceDependencyUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to inspect assurance dependency registry."); } }
export async function POST(request: Request) { try { await requireAssuranceDependencyUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect assurance dependency registry."); } }
