import { apiError, apiSuccess } from "@/src/server/api/response";
import { buildGovernanceWeaknessMappingRules } from "@/services/governance-weakness";
import { requireGovernanceWeaknessUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceWeaknessUser();
    return apiSuccess({ mapping_model_version: "GOV-WEAKNESS-MAPPING-V1", rules: buildGovernanceWeaknessMappingRules() });
  } catch (error) {
    return apiError(error, "Unable to load Governance Weakness mapping rules.");
  }
}
