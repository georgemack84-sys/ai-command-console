import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireAssuranceDependencyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceDependencyUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to replay assurance dependencies."); } }
export async function POST(request: Request) { try { await requireAssuranceDependencyUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to replay assurance dependencies."); } }
