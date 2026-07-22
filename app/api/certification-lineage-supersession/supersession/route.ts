import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireCertificationLineageUser, supersessionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCertificationLineageUser(); return apiSuccess(await supersessionRequest()); } catch (error) { return apiError(error, "Unable to load certification supersession."); } }
export async function POST(request: Request) { try { await requireCertificationLineageUser(); return apiSuccess(await supersessionRequest(request)); } catch (error) { return apiError(error, "Unable to load certification supersession."); } }
