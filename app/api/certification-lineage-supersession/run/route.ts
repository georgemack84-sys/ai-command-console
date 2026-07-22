import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireCertificationLineageUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCertificationLineageUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run certification lineage supersession."); } }
export async function POST(request: Request) { try { await requireCertificationLineageUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run certification lineage supersession."); } }
