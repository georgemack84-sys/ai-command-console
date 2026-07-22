import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategicFoundationUser, vocabularyRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicFoundationUser(); return apiSuccess(await vocabularyRequest()); } catch (error) { return apiError(error, "Unable to inspect strategic vocabulary registry."); } }
export async function POST(request: Request) { try { await requireStrategicFoundationUser(); return apiSuccess(await vocabularyRequest(request)); } catch (error) { return apiError(error, "Unable to inspect strategic vocabulary registry."); } }
