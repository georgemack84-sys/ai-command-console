import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requirePersistentKnowledgeQualificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePersistentKnowledgeQualificationUser();
    return apiSuccess(await observabilityRequest());
  } catch (error) {
    return apiError(error, "Unable to retrieve persistent knowledge qualification observability.");
  }
}

export async function POST(request: Request) {
  try {
    await requirePersistentKnowledgeQualificationUser();
    return apiSuccess(await observabilityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect persistent knowledge qualification observability.");
  }
}
