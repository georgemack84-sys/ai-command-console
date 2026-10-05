import { tandemMissionKnowledgeAttachmentSchema, type TandemKnowledgePackage, type TandemMissionKnowledgeAttachment } from "@/src/tandem/nuru-knowledge-contracts";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

type StoredAttachment = { id: string; workspaceId: string; missionId: string; packageId: string; attachedBy: string; attachedAt: Date; knowledgePackage: unknown };
export type NuruTandemMissionContextStore = {
  create(input: StoredAttachment): Promise<StoredAttachment>;
  list(workspaceId: string, missionId: string): Promise<StoredAttachment[]>;
};

const defaultStore: NuruTandemMissionContextStore = {
  async create(input) {
    const attachments = nuruKnowledgeRepository.tandemMissionKnowledgePackage as unknown as { create(args: unknown): Promise<StoredAttachment> };
    return attachments.create({ data: { id: input.id, workspaceId: input.workspaceId, missionId: input.missionId, packageId: input.packageId, attachedBy: input.attachedBy, attachedAt: input.attachedAt, knowledgePackage: input.knowledgePackage } });
  },
  async list(workspaceId, missionId) {
    const attachments = nuruKnowledgeRepository.tandemMissionKnowledgePackage as unknown as { findMany(args: unknown): Promise<StoredAttachment[]> };
    return attachments.findMany({ where: { workspaceId, missionId }, orderBy: { attachedAt: "asc" }, take: 100 });
  },
};

/** Append-only Tandem context snapshots. A stored package is evidence of what a mission saw, never a Nuru write. */
export class NuruTandemMissionContextService {
  constructor(private readonly store: NuruTandemMissionContextStore = defaultStore) {}

  async attach(packageToAttach: TandemKnowledgePackage, context: { workspaceId: string; missionId: string; attachedBy: string }): Promise<TandemMissionKnowledgeAttachment> {
    if (packageToAttach.missionId !== context.missionId) throw new Error("A knowledge package can only be attached to its own mission.");
    const attachment = tandemMissionKnowledgeAttachmentSchema.parse({
      attachmentId: `TANDEM-NURU-${crypto.randomUUID()}`, workspaceId: context.workspaceId, missionId: context.missionId, attachedBy: context.attachedBy,
      attachedAt: new Date().toISOString(), package: packageToAttach, immutable: true, canonicalKnowledgeEffect: "NONE",
    });
    await this.store.create({ id: attachment.attachmentId, workspaceId: attachment.workspaceId, missionId: attachment.missionId, packageId: attachment.package.packageId, attachedBy: attachment.attachedBy, attachedAt: new Date(attachment.attachedAt), knowledgePackage: attachment.package });
    return attachment;
  }

  async list(workspaceId: string, missionId: string): Promise<TandemMissionKnowledgeAttachment[]> {
    const records = await this.store.list(workspaceId, missionId);
    return records.map((record) => tandemMissionKnowledgeAttachmentSchema.parse({ attachmentId: record.id, workspaceId: record.workspaceId, missionId: record.missionId, attachedBy: record.attachedBy, attachedAt: record.attachedAt.toISOString(), package: record.knowledgePackage, immutable: true, canonicalKnowledgeEffect: "NONE" }));
  }
}

export const nuruTandemMissionContextService = new NuruTandemMissionContextService();
