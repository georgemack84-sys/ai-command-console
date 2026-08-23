import type { SkillEdge, SkillNode } from "../../types/learning-constitution/skillGraph";
import { buildSkillGraphReadModel } from "./skillGraph";

const createdAt = "2026-08-21T00:00:00.000Z";
const version = "skill-graph-v1";
const node = (id: string, slug: string, name: string, description: string, prerequisites: readonly string[] = []): SkillNode => ({
  id, slug, name, description, status: "ACTIVE", prerequisites, mastery: null, confidence: 0,
  last_evaluated: null, retention_score: null, evidence: [], created_at: createdAt, updated_at: createdAt, model_version: version,
});
const edge = (id: string, from: string, to: string, type: SkillEdge["type"], rationale: string, strength?: number): SkillEdge => ({ id, from_skill_id: from, to_skill_id: to, type, rationale, created_at: createdAt, ...(strength === undefined ? {} : { strength }) });

export const LINUX_SKILL_GRAPH_NODES: readonly SkillNode[] = [
  node("linux", "linux", "Linux", "Foundational Linux administration."),
  node("linux.filesystems", "linux.filesystems", "Filesystems", "Linux filesystem navigation and storage concepts."),
  node("linux.bash", "linux.bash", "Bash", "Shell command composition and scripting fundamentals."),
  node("linux.permissions", "linux.permissions", "Permissions", "Linux ownership and access-control fundamentals."),
  node("linux.processes", "linux.processes", "Processes", "Process inspection, lifecycle, and control."),
  node("linux.networking", "linux.networking", "Networking", "Linux network configuration and diagnosis."),
  node("linux.systemd", "linux.systemd", "systemd", "Service management and system initialization."),
  node("linux.systemd.units", "linux.systemd.units", "Units", "systemd unit structure and lifecycle.", ["linux.processes"]),
  node("linux.systemd.dependencies", "linux.systemd.dependencies", "Dependencies", "systemd ordering and dependency relationships."),
  node("linux.systemd.journald", "linux.systemd.journald", "Journald", "Journal querying and interpretation."),
  node("linux.systemd.troubleshooting", "linux.systemd.troubleshooting", "Troubleshooting", "Diagnosing systemd service failures.", ["linux.systemd.units", "linux.systemd.dependencies", "linux.systemd.journald"]),
];

export const LINUX_SKILL_GRAPH_EDGES: readonly SkillEdge[] = [
  ...["linux.filesystems", "linux.bash", "linux.permissions", "linux.processes", "linux.networking", "linux.systemd"].map((id) => edge(`contains-linux-${id}`, id, "linux", "CONTAINS", "Linux topic hierarchy.")),
  ...["linux.systemd.units", "linux.systemd.dependencies", "linux.systemd.journald", "linux.systemd.troubleshooting"].map((id) => edge(`contains-systemd-${id}`, id, "linux.systemd", "CONTAINS", "systemd topic hierarchy.")),
  edge("prerequisite-processes-units", "linux.processes", "linux.systemd.units", "PREREQUISITE", "Process state informs unit lifecycle diagnosis.", 0.8),
  edge("prerequisite-units-troubleshooting", "linux.systemd.units", "linux.systemd.troubleshooting", "PREREQUISITE", "Unit behavior is needed to diagnose failures.", 0.9),
  edge("prerequisite-dependencies-troubleshooting", "linux.systemd.dependencies", "linux.systemd.troubleshooting", "PREREQUISITE", "Dependency failures can block service startup.", 0.8),
  edge("prerequisite-journald-troubleshooting", "linux.systemd.journald", "linux.systemd.troubleshooting", "PREREQUISITE", "Journal interpretation localizes service failures.", 0.9),
];

export const LINUX_SKILL_GRAPH = buildSkillGraphReadModel(LINUX_SKILL_GRAPH_NODES, LINUX_SKILL_GRAPH_EDGES);
