import { apiError, apiSuccess } from "@/src/server/api/response";
import { planRequest, requireAssuranceDependencyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceDependencyUser(); return apiSuccess(await planRequest()); } catch (error) { return apiError(error, "Unable to inspect assurance execution plan."); } }
export async function POST(request: Request) { try { await requireAssuranceDependencyUser(); return apiSuccess(await planRequest(request)); } catch (error) { return apiError(error, "Unable to inspect assurance execution plan."); } }
