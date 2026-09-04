import type { ApprovedLearningExample, ExampleArtifactRecord, ExampleCoverage, LearningExample } from "../../types/learning-constitution/exampleLibrary";
import { ExampleLibraryService } from "./exampleLibraryService";

const isApproved = (value: unknown): value is ApprovedLearningExample => typeof value === "object" && value !== null && (value as { status?: unknown }).status === "APPROVED" && (value as { authority?: unknown }).authority === "APPROVED_EXAMPLE" && typeof (value as { example?: unknown }).example === "object";
/** Coverage derives only from immutable approval artifacts; candidates and reviews never inflate it. */
export class ExampleCoverageService {
  summarize(parentId: string, artifacts: readonly ExampleArtifactRecord[]): Readonly<{ coverage: ExampleCoverage; approvedExamples: readonly LearningExample[]; approvedExampleIds: readonly string[]; candidateExampleIds: readonly string[]; reviewStatusByExampleId: Readonly<Record<string, "PENDING" | "APPROVED" | "REJECTED">>; }> {
    const reviews: Record<string, "PENDING" | "APPROVED" | "REJECTED"> = {};
    for (const artifact of artifacts) {
      const payload = artifact.payload as { exampleId?: unknown; action?: unknown }; const exampleId = typeof payload.exampleId === "string" ? payload.exampleId : undefined;
      if (artifact.artifactType === "REVIEW" && exampleId) reviews[exampleId] = payload.action === "APPROVE" ? "APPROVED" : "REJECTED";
    }
    const candidateExampleIds = artifacts.filter((artifact) => artifact.artifactType === "CANDIDATE" && typeof (artifact.payload as { exampleId?: unknown }).exampleId === "string").map((artifact) => (artifact.payload as { exampleId: string }).exampleId);
    for (const exampleId of candidateExampleIds) if (!reviews[exampleId]) reviews[exampleId] = "PENDING";
    const approvedExamples = artifacts.filter((artifact) => artifact.artifactType === "APPROVAL" && isApproved(artifact.payload)).map((artifact) => (artifact.payload as ApprovedLearningExample).example);
    const approvedExampleIds = artifacts.filter((artifact) => artifact.artifactType === "APPROVAL" && isApproved(artifact.payload)).map((artifact) => (artifact.payload as ApprovedLearningExample).example.exampleId);
    return { coverage: new ExampleLibraryService({ validate: () => { throw new Error("coverage does not validate"); } }).coverage(parentId, approvedExamples), approvedExamples, approvedExampleIds, candidateExampleIds, reviewStatusByExampleId: reviews };
  }
}
