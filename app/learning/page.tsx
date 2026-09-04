import { requireSessionUser } from "@/src/lib/auth";
import { SkillExplorer } from "@/src/components/learning/skill-explorer";
import { AssessmentFlow } from "@/src/components/learning/assessment-flow";
import { LearningPlanPanel } from "@/src/components/learning/learning-plan-panel";
import { LINUX_SKILL_GRAPH } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

export default async function LearningPage() {
  await requireSessionUser();
  return <div className="space-y-6"><AssessmentFlow /><LearningPlanPanel /><SkillExplorer graph={LINUX_SKILL_GRAPH} /></div>;
}
