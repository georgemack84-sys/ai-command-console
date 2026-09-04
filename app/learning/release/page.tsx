import { requireSessionUser } from "@/src/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { buildSkillGraphMigrationReport, evaluateSkillGraphCalibration, evaluateSkillGraphRelease, LINUX_SKILL_GRAPH_NODES } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

export default async function LearningReleasePage() {
  await requireSessionUser();
  const migration = buildSkillGraphMigrationReport([], LINUX_SKILL_GRAPH_NODES);
  const report = evaluateSkillGraphRelease(migration, evaluateSkillGraphCalibration([]), true);
  return <Card><CardHeader><CardTitle>Skill graph release qualification</CardTitle><CardDescription>Default rollout remains on the flat skill list until migration accounting and calibration are complete.</CardDescription></CardHeader><CardContent className="space-y-3">{report.checks.map((check) => <div key={check.check_id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="font-medium text-white">{check.check_id}: {check.passed ? "passed" : "blocked"}</p><p className="mt-1 text-sm text-slate-300">{check.detail}</p></div>)}<p className="text-sm text-slate-400">Rollback: disable <code>skill_graph_v1</code> to restore {report.rollback.mode}.</p></CardContent></Card>;
}
