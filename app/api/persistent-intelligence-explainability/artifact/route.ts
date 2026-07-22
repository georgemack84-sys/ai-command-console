import { apiError, apiSuccess } from "@/src/server/api/response";
import { artifactRequest, requireExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireExplainabilityUser(); return apiSuccess(await artifactRequest()); } catch (error) { return apiError(error, "Unable to explain persistent intelligence artifact."); } }
export async function POST(request: Request) { try { await requireExplainabilityUser(); return apiSuccess(await artifactRequest(request)); } catch (error) { return apiError(error, "Unable to explain persistent intelligence artifact."); } }
