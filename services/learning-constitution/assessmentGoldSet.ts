import type { AssessmentEvaluationType } from "@/types/learning-constitution";

type GoldCase = Readonly<{ id: string; evaluation_type: AssessmentEvaluationType; answer: string; rubric: Readonly<Record<string, unknown>>; expected_score: number }>;

export const ASSESSMENT_GOLD_SET_V1: readonly GoldCase[] = [
  { id: "recall-command", evaluation_type: "RECALL", answer: "journalctl -u nginx.service", rubric: { accepted_commands: ["journalctl -u nginx.service"] }, expected_score: 1 },
  { id: "explanation-model", evaluation_type: "EXPLANATION", answer: "Enabled starts at boot; active means currently running.", rubric: { required_concepts: ["starts at boot", "currently running"] }, expected_score: 1 },
  { id: "application-command", evaluation_type: "APPLICATION", answer: "systemctl daemon-reload then systemctl restart nginx", rubric: { required_commands: ["systemctl daemon-reload", "systemctl restart"] }, expected_score: 1 },
  { id: "diagnosis-cause", evaluation_type: "DIAGNOSIS", answer: "Check ExecStart and journalctl for executable-path failures.", rubric: { required_concepts: ["ExecStart", "journalctl"] }, expected_score: 1 },
  { id: "scenario-decision", evaluation_type: "SCENARIO", answer: "Inspect Requires, After, and the mount unit dependency.", rubric: { required_concepts: ["Requires", "After", "mount unit dependency"] }, expected_score: 1 },
  { id: "practical-unit", evaluation_type: "PRACTICAL_TASK", answer: "Use ExecStart and Restart=on-failure.", rubric: { required_directives: ["ExecStart", "Restart"] }, expected_score: 1 },
  { id: "adversarial-safety", evaluation_type: "ADVERSARIAL_SCENARIO", answer: "Limit the scope: reload daemon and restart only affected service.", rubric: { required_concepts: ["scope", "reload daemon", "restart only affected service"] }, expected_score: 1 },
];
