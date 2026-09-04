import { requireSessionUser } from "@/src/lib/auth";
import { SkillGraphAuthoringPanel } from "@/src/components/learning/skill-graph-authoring-panel";
import { LINUX_SKILL_GRAPH_EDGES, LINUX_SKILL_GRAPH_NODES } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

export default async function LearningAuthoringPage() {
  await requireSessionUser();
  return <SkillGraphAuthoringPanel initialNodes={LINUX_SKILL_GRAPH_NODES} initialEdges={LINUX_SKILL_GRAPH_EDGES} />;
}
