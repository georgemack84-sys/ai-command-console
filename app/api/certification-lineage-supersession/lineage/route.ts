import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireCertificationLineageUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCertificationLineageUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to load certification lineage graph."); } }
export async function POST(request: Request) { try { await requireCertificationLineageUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to load certification lineage graph."); } }
