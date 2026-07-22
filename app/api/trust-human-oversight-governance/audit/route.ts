import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditRequest, requireTrustHumanOversightUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustHumanOversightUser(); return apiSuccess(await auditRequest()); } catch (error) { return apiError(error, "Unable to load Trust Human Oversight audit record."); } }
export async function POST(request: Request) { try { await requireTrustHumanOversightUser(); return apiSuccess(await auditRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Human Oversight audit record."); } }
