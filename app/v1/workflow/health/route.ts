import { apiSuccess } from "@/src/server/api/response";
import { getNuruWorkflowHealth } from "@/src/server/services/nuru-workflow-evidence-contract-service";

export const dynamic = "force-dynamic";

/** Public readiness metadata. It intentionally contains no tenant data or credentials. */
export async function GET() {
  return apiSuccess(getNuruWorkflowHealth());
}
