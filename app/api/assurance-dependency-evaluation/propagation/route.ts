import { apiError, apiSuccess } from "@/src/server/api/response";
import { propagationRequest, requireAssuranceDependencyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceDependencyUser(); return apiSuccess(await propagationRequest()); } catch (error) { return apiError(error, "Unable to inspect assurance propagation."); } }
export async function POST(request: Request) { try { await requireAssuranceDependencyUser(); return apiSuccess(await propagationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect assurance propagation."); } }
