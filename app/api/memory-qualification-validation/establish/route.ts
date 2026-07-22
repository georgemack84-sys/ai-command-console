import { apiError, apiSuccess } from "@/src/server/api/response";
import { establishRequest, requireMemoryQualificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMemoryQualificationUser();
    return apiSuccess(await establishRequest(request));
  } catch (error) {
    return apiError(error, "Unable to establish memory qualification validation.");
  }
}
