import { apiError, apiSuccess } from "@/src/server/api/response";
import { indexRequest, requireApplicationEvidenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationEvidenceUser(); return apiSuccess(await indexRequest()); } catch (error) { return apiError(error, "Unable to inspect application evidence index."); } }
export async function POST(request: Request) { try { await requireApplicationEvidenceUser(); return apiSuccess(await indexRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application evidence index."); } }
