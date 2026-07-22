import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePhase13CertificationUser, testsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase13CertificationUser(); return apiSuccess(await testsRequest()); } catch (error) { return apiError(error, "Unable to retrieve Phase 13 certification tests."); } }
export async function POST(request: Request) { try { await requirePhase13CertificationUser(); return apiSuccess(await testsRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve Phase 13 certification tests."); } }
