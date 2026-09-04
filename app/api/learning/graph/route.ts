import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { isFeatureEnabled } from "@/src/server/feature-flags/feature-flag-service";
import { buildSkillGraphReadModel } from "@/services/learning-constitution";
import { ensureLinuxSkillGraphSeeded } from "@/src/server/learning/skill-graph-bootstrap";

export async function GET() { try { const user = await getSessionUser(); if (!user) throw new Error("Authentication required."); const enabled = await isFeatureEnabled("skill_graph_v1", user.workspaceId); if (!enabled) return apiSuccess({ mode: "FLAT_LIST" }); const repository = await ensureLinuxSkillGraphSeeded(); return apiSuccess({ mode: "SKILL_GRAPH", graph: buildSkillGraphReadModel(await repository.findAllNodes(), await repository.findAllEdges()) }); } catch (error) { return apiError(error, "Unable to load learning graph."); } }
