import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireApplicationLifecycleCertificationUser, versionLineageRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await versionLineageRequest()); } catch (error) { return apiError(error, "Unable to inspect application version lineage."); } }
export async function POST(request: Request) { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await versionLineageRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application version lineage."); } }
