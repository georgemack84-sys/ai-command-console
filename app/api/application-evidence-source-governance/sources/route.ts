import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireApplicationEvidenceUser, sourcesRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationEvidenceUser(); return apiSuccess(await sourcesRequest()); } catch (error) { return apiError(error, "Unable to inspect source registry."); } }
export async function POST(request: Request) { try { await requireApplicationEvidenceUser(); return apiSuccess(await sourcesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect source registry."); } }
