import { type CodexBuildPackage, type ProjectDecision, type ProjectRequirement } from "@/src/nuru/vault-contracts";
import { NuruBuildPackageReadinessService, type BuildPackageReadinessStore } from "@/src/server/services/nuru-build-package-readiness-service";

export class CodexWorkBriefError extends Error { constructor(public readonly readiness: Awaited<ReturnType<typeof NuruBuildPackageReadinessService.inspect>>) { super("This build package is not ready for a Codex work brief."); this.name = "CodexWorkBriefError"; } }
export const NuruCodexWorkBriefService = {
  async generate(packageId: string, store: BuildPackageReadinessStore) {
    const readiness = await NuruBuildPackageReadinessService.inspect(packageId, store); if (!readiness.ready) throw new CodexWorkBriefError(readiness);
    const records = await store.readVaultRecords(); const buildPackage = records.find((record): record is CodexBuildPackage => record.kind === "CODEX_BUILD_PACKAGE" && record.id === packageId); if (!buildPackage) throw new Error("The requested Codex build package was not found."); const requirements = buildPackage.requirementIds.map((id) => records.find((record): record is ProjectRequirement => record.kind === "PROJECT_REQUIREMENT" && record.id === id)); const decisions = buildPackage.architectureDecisionIds.map((id) => records.find((record): record is ProjectDecision => record.kind === "PROJECT_DECISION" && record.id === id));
    const list = (items: readonly string[]) => items.map((item) => `- ${item}`).join("\n") || "- None";
    return { packageId, brief: `PROJECT: ${buildPackage.project}\n\nBUILD PACKAGE: ${buildPackage.id}\n\nOBJECTIVE:\n${buildPackage.objective}\n\nREQUIREMENTS:\n${requirements.map((item) => `- ${item?.title ?? "Unavailable requirement"}`).join("\n")}\n\nARCHITECTURE CONTEXT:\n${decisions.map((item) => `- ${item?.question ?? "Unavailable decision"}: ${item?.decision ?? ""}`).join("\n")}\n\nEXPECTED FILES:\n${list(buildPackage.expectedFiles)}\n\nINTERFACES:\n${list(buildPackage.interfaces)}\n\nTESTS:\n${list(buildPackage.testRefs)}\n\nDEPENDENCIES:\n${list(buildPackage.dependencies)}\n\nEXIT CRITERIA:\n${list(buildPackage.exitCriteria)}\n\nVERIFICATION COMMANDS:\n${list(buildPackage.verificationCommands)}\n\nCONSTRAINT:\nDo not claim completion unless every verification command and exit criterion passes.` };
  },
};
