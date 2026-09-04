import { prisma } from "../../src/server/db/prisma";
import type { AuthorityRecord } from "../../types/learning-constitution/authorityRecord";
import type { RegistryVersionProvider } from "./controlledRegistryWriter";

type StoredAuthorityBinding = Readonly<{ authorityRecord: unknown }>;
type StoredRegistryState = Readonly<{ version: number }>;
type Phase9PrismaClient = Readonly<{
  noesisAuthorityBinding: Readonly<{
    findUnique(args: object): Promise<StoredAuthorityBinding | null>;
  }>;
  noesisDurableRegistryState: Readonly<{
    findUnique(args: object): Promise<StoredRegistryState | null>;
  }>;
}>;

// Prisma Client is generated during deployment after Phase 9 migration deploy.
const phase9Client = prisma as unknown as Phase9PrismaClient;

export interface AuthorityBindingRepository {
  find(workspaceId: string, authorityId: string): Promise<AuthorityRecord | undefined>;
}

/** A workspace-scoped authority lookup; an absent binding never implies authority. */
export class PrismaAuthorityBindingRepository implements AuthorityBindingRepository {
  constructor(private readonly client: Phase9PrismaClient = phase9Client) {}

  async find(workspaceId: string, authorityId: string): Promise<AuthorityRecord | undefined> {
    if (!workspaceId.trim() || !authorityId.trim()) return undefined;
    const record = await this.client.noesisAuthorityBinding.findUnique({
      where: { workspaceId_authorityId: { workspaceId, authorityId } },
    });
    return record?.authorityRecord as AuthorityRecord | undefined;
  }
}

/** Reads the version used to bind a Phase 9 commit authorization. */
export class PrismaRegistryVersionProvider implements RegistryVersionProvider {
  constructor(private readonly workspaceId: string, private readonly client: Phase9PrismaClient = phase9Client) {}

  async currentVersion(): Promise<string> {
    if (!this.workspaceId.trim()) throw new Error("durable registry version requires a workspace scope");
    const state = await this.client.noesisDurableRegistryState.findUnique({ where: { workspaceId: this.workspaceId } });
    return String(state?.version ?? 0);
  }
}
