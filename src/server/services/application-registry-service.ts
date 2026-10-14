import { z } from "zod";
import { randomUUID } from "node:crypto";
import { prisma } from "@/src/server/db/prisma";
import { AppError } from "@/src/server/api/errors";

const contractVersion = z.string().regex(/^\d+\.\d+$/, "Contract versions must use major.minor format.");
const metadata = z.record(z.string().min(1).max(64), z.string().max(500)).refine(
  (value) => Object.keys(value).length <= 20,
  "Metadata is limited to 20 entries.",
);

export const applicationRegistrationSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9-]{1,62}$/, "Use lowercase letters, numbers, and hyphens."),
  displayName: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(1_000),
  ownerApplicationContact: z.string().trim().email().max(320),
  supportedContractVersions: z.array(contractVersion).min(1).max(10).refine(
    (versions) => new Set(versions).size === versions.length,
    "Contract versions must be unique.",
  ),
  metadata: metadata.default({}),
}).strict();

export type ApplicationRegistrationInput = z.infer<typeof applicationRegistrationSchema>;
export type RegisteredApplicationView = Readonly<{
  applicationId: string;
  slug: string;
  displayName: string;
  description: string;
  ownerApplicationContact: string;
  lifecycleState: "DRAFT" | "ACTIVE" | "SUSPENDED" | "MAINTENANCE" | "DEPRECATED" | "RETIRED";
  supportedContractVersions: readonly string[];
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}>;

type StoredApplication = RegisteredApplicationView;

export type ApplicationRegistryTransaction = {
  findBySlug(workspaceId: string, slug: string): Promise<StoredApplication | null>;
  create(workspaceId: string, input: StoredApplication): Promise<StoredApplication>;
  appendAudit(input: { workspaceId: string; userId: string; type: string; title: string; description: string; metadata: Record<string, string> }): Promise<void>;
};

export type ApplicationRegistryStore = {
  transaction<T>(work: (transaction: ApplicationRegistryTransaction) => Promise<T>): Promise<T>;
  list(workspaceId: string): Promise<readonly StoredApplication[]>;
};

function toView(value: {
  id: string; slug: string; displayName: string; description: string; ownerApplicationContact: string;
  lifecycleState: RegisteredApplicationView["lifecycleState"]; supportedContractVersions: string[];
  metadata: unknown; createdAt: Date; updatedAt: Date; createdById: string;
}): RegisteredApplicationView {
  const candidate = value.metadata && typeof value.metadata === "object" && !Array.isArray(value.metadata)
    ? value.metadata as Record<string, unknown>
    : {};
  const safeMetadata = Object.fromEntries(Object.entries(candidate).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  return {
    applicationId: value.id, slug: value.slug, displayName: value.displayName, description: value.description,
    ownerApplicationContact: value.ownerApplicationContact, lifecycleState: value.lifecycleState,
    supportedContractVersions: value.supportedContractVersions, metadata: safeMetadata,
    createdAt: value.createdAt.toISOString(), updatedAt: value.updatedAt.toISOString(), createdById: value.createdById,
  };
}

const prismaStore: ApplicationRegistryStore = {
  transaction: (work) => prisma.$transaction(async (transaction) => work({
    findBySlug: async (workspaceId, slug) => {
      const application = await transaction.registeredApplication.findUnique({ where: { workspaceId_slug: { workspaceId, slug } } });
      return application ? toView(application) : null;
    },
    create: async (workspaceId, input) => toView(await transaction.registeredApplication.create({
      data: {
        id: input.applicationId, workspaceId, slug: input.slug,
        displayName: input.displayName, description: input.description, ownerApplicationContact: input.ownerApplicationContact,
        lifecycleState: input.lifecycleState, supportedContractVersions: [...input.supportedContractVersions],
        metadata: input.metadata, createdById: input.createdById,
      },
    })),
    appendAudit: async (input) => { await transaction.activityEvent.create({ data: input }); },
  })),
  list: async (workspaceId) => (await prisma.registeredApplication.findMany({
    where: { workspaceId }, orderBy: [{ createdAt: "asc" }],
  })).map(toView),
};

function sameRegistration(existing: StoredApplication, input: ApplicationRegistrationInput) {
  return existing.displayName === input.displayName
    && existing.description === input.description
    && existing.ownerApplicationContact === input.ownerApplicationContact
    && JSON.stringify([...existing.supportedContractVersions].sort()) === JSON.stringify([...input.supportedContractVersions].sort())
    && JSON.stringify(Object.entries(existing.metadata).sort(([left], [right]) => left.localeCompare(right)))
      === JSON.stringify(Object.entries(input.metadata).sort(([left], [right]) => left.localeCompare(right)));
}

export async function registerApplication(
  workspaceId: string,
  actorId: string,
  rawInput: unknown,
  store: ApplicationRegistryStore = prismaStore,
) {
  const input = applicationRegistrationSchema.parse(rawInput);
  return store.transaction(async (transaction) => {
    const existing = await transaction.findBySlug(workspaceId, input.slug);
    if (existing) {
      if (sameRegistration(existing, input)) return { application: existing, created: false } as const;
      throw new AppError(409, "application_slug_conflict", "An application with this slug already exists in the workspace.");
    }

    const now = new Date().toISOString();
    const application: StoredApplication = {
      applicationId: randomUUID(), ...input, lifecycleState: "DRAFT", createdById: actorId,
      createdAt: now, updatedAt: now, metadata: input.metadata,
    };
    const created = await transaction.create(workspaceId, application);
    await transaction.appendAudit({
      workspaceId, userId: actorId, type: "application.registered", title: "Application registered",
      description: `${created.displayName} was registered in draft state. Registration grants no execution authority.`,
      metadata: { applicationId: created.applicationId, slug: created.slug, lifecycleState: created.lifecycleState },
    });
    return { application: created, created: true } as const;
  });
}

export async function listRegisteredApplications(workspaceId: string, store: ApplicationRegistryStore = prismaStore) {
  return store.list(workspaceId);
}
