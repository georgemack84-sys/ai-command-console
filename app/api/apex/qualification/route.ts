import { apiError, apiSuccess } from "@/src/server/api/response";
import { qualificationRequest, requireApexUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApexUser(); return apiSuccess(await qualificationRequest()); } catch (error) { return apiError(error, "Unable to inspect APEX qualification."); } }
export async function POST(request: Request) { try { await requireApexUser(); return apiSuccess(await qualificationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect APEX qualification."); } }
