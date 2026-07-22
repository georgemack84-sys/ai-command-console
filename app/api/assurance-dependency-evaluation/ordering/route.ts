import { apiError, apiSuccess } from "@/src/server/api/response";
import { orderingRequest, requireAssuranceDependencyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceDependencyUser(); return apiSuccess(await orderingRequest()); } catch (error) { return apiError(error, "Unable to inspect assurance dependency ordering."); } }
export async function POST(request: Request) { try { await requireAssuranceDependencyUser(); return apiSuccess(await orderingRequest(request)); } catch (error) { return apiError(error, "Unable to inspect assurance dependency ordering."); } }
