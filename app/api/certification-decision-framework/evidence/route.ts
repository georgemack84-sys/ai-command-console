import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireCertificationDecisionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCertificationDecisionUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to inspect certification evidence binder."); } }
export async function POST(request: Request) { try { await requireCertificationDecisionUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect certification evidence binder."); } }
