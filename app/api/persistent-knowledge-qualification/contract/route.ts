import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requirePersistentKnowledgeQualificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePersistentKnowledgeQualificationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve persistent knowledge qualification contract.");
  }
}
