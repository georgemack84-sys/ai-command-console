import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireCertificationLineageUser, violationsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCertificationLineageUser(); return apiSuccess(await violationsRequest()); } catch (error) { return apiError(error, "Unable to load certification violations."); } }
export async function POST(request: Request) { try { await requireCertificationLineageUser(); return apiSuccess(await violationsRequest(request)); } catch (error) { return apiError(error, "Unable to load certification violations."); } }
