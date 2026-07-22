import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireCertificationDecisionUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCertificationDecisionUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run certification decision framework."); } }
export async function POST(request: Request) { try { await requireCertificationDecisionUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run certification decision framework."); } }
