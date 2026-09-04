import { prisma } from "../../src/server/db/prisma";
import type { CandidatePrinciple, CandidatePrincipleRepository, CandidatePrincipleReview, CandidatePrincipleReviewRepository, DurablePrinciple, HumanAuthorizedPrinciple, PotentialPattern, PotentialPatternRepository, PrincipleReassessmentRepository, PrincipleReassessmentTrigger, PrincipleRegistry } from "../../types/learning-constitution/principleLearning";
import { canonicalizeAuditValue } from "./auditIntegrityHash";

type Row = Readonly<{ artifactId: string; workspaceId: string; artifactType: string; subjectId: string; payload: unknown }>;
type Client = Readonly<{ noesisPrincipleArtifact: Readonly<{ findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]>; create(args: object): Promise<Row> }> }>;
const client = prisma as unknown as Client;

/** Shared append-only persistence for all Phase 13 artifacts. Each artifact remains independently immutable. */
export class PrismaPrincipleLearningRepository implements PotentialPatternRepository, CandidatePrincipleRepository, CandidatePrincipleReviewRepository, PrincipleRegistry, PrincipleReassessmentRepository {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}
  async append(pattern: PotentialPattern): Promise<PotentialPattern>;
  async append(candidate: CandidatePrinciple): Promise<CandidatePrinciple>;
  async append(review: CandidatePrincipleReview): Promise<CandidatePrincipleReview>;
  async append(principle: DurablePrinciple): Promise<DurablePrinciple>;
  async append(trigger: PrincipleReassessmentTrigger): Promise<PrincipleReassessmentTrigger>;
  async append(value: PotentialPattern | CandidatePrinciple | CandidatePrincipleReview | DurablePrinciple | PrincipleReassessmentTrigger): Promise<PotentialPattern | CandidatePrinciple | CandidatePrincipleReview | DurablePrinciple | PrincipleReassessmentTrigger> {
    if ("triggerId" in value) return this.appendArtifact("REASSESSMENT", value.triggerId, value.principleId, value.requestedAt, value);
    if ("reviewId" in value) return this.appendArtifact("REVIEW", value.reviewId, value.candidatePrincipleId, value.reviewedAt, value);
    if ("candidatePrincipleId" in value) return this.appendArtifact("CANDIDATE", value.candidatePrincipleId, value.candidatePrincipleId, value.createdAt, value);
    if ("patternId" in value) return this.appendArtifact("PATTERN", value.patternId, value.patternId, value.createdAt, value);
    return this.appendArtifact("DURABLE_PRINCIPLE", value.principleId, value.principleId, value.createdAt, value);
  }
  async appendReview(review: CandidatePrincipleReview): Promise<CandidatePrincipleReview> { return this.appendArtifact("REVIEW", review.reviewId, review.candidatePrincipleId, review.reviewedAt, review); }
  async appendInterpretation(interpretation: HumanAuthorizedPrinciple): Promise<HumanAuthorizedPrinciple> { return this.appendArtifact("INTERPRETATION", interpretation.interpretationId, interpretation.candidatePrincipleId, interpretation.authorizedAt, interpretation); }
  async appendPrinciple(principle: DurablePrinciple): Promise<DurablePrinciple> { return this.appendArtifact("DURABLE_PRINCIPLE", principle.principleId, principle.principleId, principle.createdAt, principle); }
  async appendReassessment(trigger: PrincipleReassessmentTrigger): Promise<PrincipleReassessmentTrigger> { return this.appendArtifact("REASSESSMENT", trigger.triggerId, trigger.principleId, trigger.requestedAt, trigger); }
  async list(candidatePrincipleId: string): Promise<readonly CandidatePrincipleReview[]>;
  async list(): Promise<readonly DurablePrinciple[]>;
  async list(candidatePrincipleId?: string): Promise<readonly CandidatePrincipleReview[] | readonly DurablePrinciple[]> {
    if (candidatePrincipleId) return (await this.rows("REVIEW", candidatePrincipleId)).map((row) => row.payload as CandidatePrincipleReview);
    return (await this.rows("DURABLE_PRINCIPLE")).map((row) => row.payload as DurablePrinciple);
  }
  async listArtifacts(subjectId: string): Promise<readonly Row[]> { return (await this.db.noesisPrincipleArtifact.findMany({ where: { workspaceId: this.workspaceId, subjectId }, orderBy: { createdAt: "asc" } })); }
  private async appendArtifact<T>(artifactType: string, rawId: string, subjectId: string, createdAt: string, payload: T): Promise<T> {
    const artifactId = `${artifactType}:${rawId}`; const existing = await this.db.noesisPrincipleArtifact.findUnique({ where: { artifactId } });
    if (existing) { if (existing.workspaceId !== this.workspaceId || canonicalizeAuditValue(existing.payload) !== canonicalizeAuditValue(payload)) throw new Error("principle artifact id collision"); return existing.payload as T; }
    await this.db.noesisPrincipleArtifact.create({ data: { artifactId, workspaceId: this.workspaceId, artifactType, subjectId, payload: payload as object, createdAt: new Date(createdAt) } }); return payload;
  }
  private async rows(artifactType: string, subjectId?: string): Promise<readonly Row[]> { return this.db.noesisPrincipleArtifact.findMany({ where: { workspaceId: this.workspaceId, artifactType, ...(subjectId ? { subjectId } : {}) }, orderBy: { createdAt: "asc" } }); }
}
