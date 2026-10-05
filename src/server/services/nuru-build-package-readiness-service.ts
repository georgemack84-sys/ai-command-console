import { type CodexBuildPackage, type ProjectDecision, type ProjectRequirement, type VaultRecord } from "@/src/nuru/vault-contracts";
import { NuruArchitectureGuardrailService, type GuardrailFinding } from "@/src/server/services/nuru-architecture-guardrail-service";

export type BuildPackageReadiness = { packageId: string; ready: boolean; checks: Array<{ name: string; passed: boolean; detail: string }>; findings: GuardrailFinding[] };
export interface BuildPackageReadinessStore { readVaultRecords(): Promise<VaultRecord[]>; }

/** Read-only preflight. A failed check never mutates package state or downgrades a blocker. */
export const NuruBuildPackageReadinessService = {
  async inspect(buildPackageId: string, store: BuildPackageReadinessStore): Promise<BuildPackageReadiness> {
    const records = await store.readVaultRecords(); const buildPackage = records.find((record): record is CodexBuildPackage => record.kind === "CODEX_BUILD_PACKAGE" && record.id === buildPackageId); if (!buildPackage) throw new Error("The requested Codex build package was not found.");
    const requirements = buildPackage.requirementIds.map((id) => records.find((record): record is ProjectRequirement => record.kind === "PROJECT_REQUIREMENT" && record.id === id && record.status === "CURRENT")); const decisions = buildPackage.architectureDecisionIds.map((id) => records.find((record): record is ProjectDecision => record.kind === "PROJECT_DECISION" && record.id === id && record.status === "CURRENT")); const findings = (await NuruArchitectureGuardrailService.inspect(store)).filter((finding) => [buildPackage.id, ...buildPackage.requirementIds].includes(finding.recordId));
    const checks = [
      { name: "Current requirements", passed: requirements.every(Boolean), detail: requirements.every(Boolean) ? "All referenced requirements are current." : "A referenced requirement is missing or superseded." },
      { name: "Architecture context", passed: decisions.every(Boolean), detail: decisions.every(Boolean) ? "All referenced architecture decisions are current." : "A referenced architecture decision is missing or superseded." },
      { name: "Verification contract", passed: buildPackage.testRefs.length > 0 && buildPackage.exitCriteria.length > 0 && buildPackage.verificationCommands.length > 0, detail: "Tests, exit criteria, and verification commands are required." },
      { name: "Dependencies", passed: buildPackage.dependencies.length === 0 || buildPackage.dependencies.every((dependency) => !dependency.startsWith("BLOCKED:")), detail: "Dependencies must not contain an explicit blocker." },
      { name: "Architecture guardrails", passed: !findings.some((finding) => finding.severity === "ERROR"), detail: findings.length ? findings.map((finding) => finding.message).join(" ") : "No related guardrail findings." },
    ];
    return { packageId: buildPackage.id, ready: checks.every((check) => check.passed), checks, findings };
  },
};
