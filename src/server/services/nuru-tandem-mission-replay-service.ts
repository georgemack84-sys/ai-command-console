import { z } from "zod";
import type { TandemMissionKnowledgeAttachment } from "@/src/tandem/nuru-knowledge-contracts";

export const tandemMissionReplayRequestSchema = z.object({ missionId: z.string().min(1), asOf: z.coerce.date() });
export type TandemMissionReplayStore = { list(workspaceId: string, missionId: string): Promise<TandemMissionKnowledgeAttachment[]> };

/** Reconstructs only recorded mission context; it never re-queries current Nuru knowledge. */
export class NuruTandemMissionReplayService {
  constructor(private readonly store: TandemMissionReplayStore) {}
  async replay(raw: unknown, workspaceId: string) {
    const request = tandemMissionReplayRequestSchema.parse(raw);
    const attachments = await this.store.list(workspaceId, request.missionId);
    const packages = attachments.filter((attachment) => new Date(attachment.attachedAt) <= request.asOf && new Date(attachment.package.retrievedAt) <= request.asOf).sort((a, b) => a.attachedAt.localeCompare(b.attachedAt));
    return { missionId: request.missionId, asOf: request.asOf.toISOString(), knowledgePackages: packages, replayPolicy: "IMMUTABLE_ATTACHED_SNAPSHOTS_ONLY" as const };
  }
}
