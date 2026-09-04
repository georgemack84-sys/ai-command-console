import type { AssessmentItem } from "@/types/learning-constitution/assessment";

const version = "linux-systemd-authored-v1";
const item = (id: string, evaluation_type: AssessmentItem["evaluation_type"], prompt: string, difficulty: number, competency_dimensions: AssessmentItem["competency_dimensions"], rubric: Record<string, unknown>): AssessmentItem => ({ id, skill_id: "linux.systemd.troubleshooting", evaluation_type, prompt, expected_response_format: "short_text", rubric, difficulty, version, competency_dimensions });

export const LINUX_SYSTEMD_ASSESSMENT_ITEM_BANK: readonly AssessmentItem[] = [
  { ...item("linux-systemd-recall-1", "RECALL", "What does Requires= express in a systemd unit dependency?", 1, ["KNOWLEDGE"], { required_concepts: ["required dependency", "fails when dependency cannot start"] }), skill_id: "linux.systemd.dependencies" },
  { ...item("linux-systemd-explanation-1", "EXPLANATION", "Explain why journalctl -u nginx.service is more useful than reading an unrelated system log during a service failure.", 2, ["KNOWLEDGE", "CALIBRATION"], { required_concepts: ["unit filtering", "relevant service logs"] }), skill_id: "linux.systemd.journald" },
  { ...item("linux-systemd-application-1", "APPLICATION", "A service unit was edited. State the commands needed to reload systemd and restart the service safely.", 3, ["APPLICATION"], { required_commands: ["systemctl daemon-reload", "systemctl restart"] }), skill_id: "linux.systemd.units" },
  item("linux-systemd-diagnosis-1", "DIAGNOSIS", "A service exits immediately with status=203/EXEC. Describe the likely cause and the first two checks you would make.", 4, ["TROUBLESHOOTING", "APPLICATION"], { required_concepts: ["executable path or permissions", "ExecStart", "journalctl"] }),
  item("linux-systemd-scenario-1", "SCENARIO", "A database unit is ordered after network-online.target but still starts before its required storage mount. What should you inspect before adding a restart loop?", 4, ["KNOWLEDGE", "APPLICATION"], { required_concepts: ["Requires", "After", "mount unit dependency"] }),
  item("linux-systemd-practical-1", "PRACTICAL_TASK", "Draft the essential [Service] directives for a long-running application that must restart on failure and write its output to the journal.", 5, ["APPLICATION", "TROUBLESHOOTING"], { required_directives: ["ExecStart", "Restart"] }),
  item("linux-systemd-adversarial-1", "ADVERSARIAL_SCENARIO", "An operator proposes running systemctl daemon-reload and systemctl restart on every unit after a single service edit. Explain the risk and the narrower safe action.", 5, ["TROUBLESHOOTING", "CALIBRATION"], { required_concepts: ["scope change", "reload daemon", "restart only affected service"] }),
];
