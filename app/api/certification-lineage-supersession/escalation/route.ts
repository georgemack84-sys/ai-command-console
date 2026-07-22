import { apiError, apiSuccess } from "@/src/server/api/response";
import { escalationRequest, requireCertificationLineageUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCertificationLineageUser(); return apiSuccess(await escalationRequest()); } catch (error) { return apiError(error, "Unable to load production escalation."); } }
export async function POST(request: Request) { try { await requireCertificationLineageUser(); return apiSuccess(await escalationRequest(request)); } catch (error) { return apiError(error, "Unable to load production escalation."); } }
