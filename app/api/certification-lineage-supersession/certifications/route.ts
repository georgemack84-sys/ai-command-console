import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationsRequest, requireCertificationLineageUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCertificationLineageUser(); return apiSuccess(await certificationsRequest()); } catch (error) { return apiError(error, "Unable to load certification attempts."); } }
export async function POST(request: Request) { try { await requireCertificationLineageUser(); return apiSuccess(await certificationsRequest(request)); } catch (error) { return apiError(error, "Unable to load certification attempts."); } }
