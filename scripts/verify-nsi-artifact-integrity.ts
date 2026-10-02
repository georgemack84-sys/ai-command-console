import { NuruArtifactIntegrityService } from "@/src/server/services/nuru-artifact-integrity-service";
import { readFile } from "node:fs/promises";

type ArtifactBaseline = {
  workspaceId: string;
  manifestHash: string;
  artifactCount: number;
  auditEventCount: number;
};

async function main() {
  const workspaceId = process.argv[2]?.trim();
  if (!workspaceId) throw new Error("Usage: npm run nsi:verify-artifacts -- <workspace-id>");

  const result = await NuruArtifactIntegrityService.verifyWorkspace(workspaceId);
  const baseline = await baselineOption(workspaceId);
  const expectedManifest = baseline?.manifestHash ?? option("--expected-manifest");
  const expectedArtifactCount = baseline?.artifactCount ?? numberOption("--expected-artifact-count");
  const expectedAuditEventCount = baseline?.auditEventCount ?? numberOption("--expected-audit-event-count");
  if (expectedManifest && expectedManifest !== result.manifestHash) throw new Error("Restored artifact manifest does not match the expected manifest.");
  if (expectedArtifactCount !== undefined && expectedArtifactCount !== result.artifactCount) throw new Error("Restored artifact count does not match the expected count.");
  if (expectedAuditEventCount !== undefined && expectedAuditEventCount !== result.auditEventCount) throw new Error("Restored artifact audit-event count does not match the expected count.");
  console.log(JSON.stringify(result, null, 2));
}

async function baselineOption(workspaceId: string): Promise<ArtifactBaseline | undefined> {
  const filePath = option("--baseline-file");
  if (!filePath) return undefined;
  if (option("--expected-manifest") || option("--expected-artifact-count") || option("--expected-audit-event-count")) {
    throw new Error("--baseline-file cannot be combined with individual expected-value options.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read artifact baseline file: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!isArtifactBaseline(parsed)) throw new Error("Artifact baseline file has an invalid shape.");
  if (parsed.workspaceId !== workspaceId) throw new Error("Artifact baseline workspace does not match the requested workspace.");
  return parsed;
}

function isArtifactBaseline(value: unknown): value is ArtifactBaseline {
  if (!value || typeof value !== "object") return false;
  const baseline = value as Record<string, unknown>;
  return typeof baseline.workspaceId === "string"
    && /^sha256:[0-9a-f]{64}$/.test(String(baseline.manifestHash))
    && Number.isSafeInteger(baseline.artifactCount) && Number(baseline.artifactCount) >= 0
    && Number.isSafeInteger(baseline.auditEventCount) && Number(baseline.auditEventCount) >= 0;
}

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1]?.trim() : undefined;
}

function numberOption(name: string) {
  const value = option(name);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`${name} must be a non-negative integer.`);
  return parsed;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
