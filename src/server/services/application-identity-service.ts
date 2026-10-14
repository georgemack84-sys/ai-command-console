import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { env } from "@/src/config/env";
import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";

const principalSchema = z.object({ displayName: z.string().trim().min(2).max(120) }).strict();
export type ServiceCredentialView = Readonly<{ credentialId: string; secretHint: string; status: "ACTIVE" | "ROTATED" | "REVOKED"; issuedAt: string; rotatedAt: string | null; revokedAt: string | null }>;
export type ServicePrincipalView = Readonly<{ principalId: string; applicationId: string; displayName: string; status: "ACTIVE" | "REVOKED"; createdAt: string; revokedAt: string | null; credentials: readonly ServiceCredentialView[] }>;

function hashCredential(value: string) {
  return createHmac("sha256", env.AI_COMMAND_CONSOLE_AUTH_SECRET).update(`application-credential:${value}`).digest("hex");
}

function issueRawCredential(credentialId: string) {
  const secret = randomBytes(32).toString("base64url");
  return { token: `papp_${credentialId}_${secret}`, secretHint: `…${secret.slice(-6)}` };
}

function toCredential(value: { id: string; secretHint: string; status: ServiceCredentialView["status"]; issuedAt: Date; rotatedAt: Date | null; revokedAt: Date | null }): ServiceCredentialView {
  return { credentialId: value.id, secretHint: value.secretHint, status: value.status, issuedAt: value.issuedAt.toISOString(), rotatedAt: value.rotatedAt?.toISOString() ?? null, revokedAt: value.revokedAt?.toISOString() ?? null };
}

function toPrincipal(value: { id: string; applicationId: string; displayName: string; status: ServicePrincipalView["status"]; createdAt: Date; revokedAt: Date | null; credentials: Array<{ id: string; secretHint: string; status: ServiceCredentialView["status"]; issuedAt: Date; rotatedAt: Date | null; revokedAt: Date | null }> }): ServicePrincipalView {
  return { principalId: value.id, applicationId: value.applicationId, displayName: value.displayName, status: value.status, createdAt: value.createdAt.toISOString(), revokedAt: value.revokedAt?.toISOString() ?? null, credentials: value.credentials.map(toCredential) };
}

async function applicationForWorkspace(workspaceId: string, applicationId: string) {
  const application = await prisma.registeredApplication.findFirst({ where: { id: applicationId, workspaceId } });
  if (!application) throw new AppError(404, "application_not_found", "Application was not found in this workspace.");
  if (["SUSPENDED", "RETIRED"].includes(application.lifecycleState)) throw new AppError(409, "application_not_credential_eligible", "Suspended or retired applications cannot receive credentials.");
  return application;
}

export async function createServicePrincipal(workspaceId: string, applicationId: string, actorId: string, rawInput: unknown) {
  const input = principalSchema.parse(rawInput);
  await applicationForWorkspace(workspaceId, applicationId);
  return prisma.$transaction(async (transaction) => {
    const principal = await transaction.applicationServicePrincipal.create({ data: { applicationId, displayName: input.displayName, createdById: actorId } });
    const issued = credentialRecord(actorId);
    const { token, ...credentialData } = issued;
    const credential = await transaction.applicationCredential.create({ data: { principalId: principal.id, ...credentialData } });
    await transaction.activityEvent.create({ data: { workspaceId, userId: actorId, type: "application.service_principal_created", title: "Application service principal created", description: `${input.displayName} was created for application ${applicationId}. It has no user identity or execution authority.`, metadata: { applicationId, principalId: principal.id, credentialId: credential.id } } });
    return { principal: toPrincipal({ ...principal, credentials: [credential] }), credential: issuedCredential({ ...credential, token }) };
  });
}

function credentialRecord(actorId: string) {
  const id = randomUUID();
  const issued = issueRawCredential(id);
  return { id, secretHash: hashCredential(issued.token), secretHint: issued.secretHint, issuedById: actorId, token: issued.token };
}

function issuedCredential(value: { id: string; secretHint: string; issuedAt: Date; status: ServiceCredentialView["status"]; rotatedAt: Date | null; revokedAt: Date | null; token?: string }) {
  return { ...toCredential(value), token: value.token };
}

export async function rotateServiceCredential(workspaceId: string, applicationId: string, principalId: string, actorId: string) {
  await applicationForWorkspace(workspaceId, applicationId);
  return prisma.$transaction(async (transaction) => {
    const principal = await transaction.applicationServicePrincipal.findFirst({ where: { id: principalId, applicationId }, include: { credentials: true } });
    if (!principal) throw new AppError(404, "service_principal_not_found", "Service principal was not found for this application.");
    if (principal.status !== "ACTIVE") throw new AppError(409, "service_principal_revoked", "Revoked service principals cannot receive credentials.");
    await transaction.applicationCredential.updateMany({ where: { principalId, status: "ACTIVE" }, data: { status: "ROTATED", rotatedAt: new Date() } });
    const issued = credentialRecord(actorId);
    const { token, ...credentialData } = issued;
    const credential = await transaction.applicationCredential.create({ data: { principalId, ...credentialData } });
    await transaction.activityEvent.create({ data: { workspaceId, userId: actorId, type: "application.credential_rotated", title: "Application credential rotated", description: `Credential rotated for service principal ${principalId}.`, metadata: { applicationId, principalId, credentialId: credential.id } } });
    return issuedCredential({ ...credential, token });
  });
}

export async function revokeServiceCredential(workspaceId: string, applicationId: string, principalId: string, credentialId: string, actorId: string) {
  await applicationForWorkspace(workspaceId, applicationId);
  const result = await prisma.$transaction(async (transaction) => {
    const credential = await transaction.applicationCredential.findFirst({ where: { id: credentialId, principalId, principal: { applicationId } } });
    if (!credential) throw new AppError(404, "service_credential_not_found", "Credential was not found for this service principal.");
    if (credential.status === "REVOKED") return toCredential(credential);
    const revoked = await transaction.applicationCredential.update({ where: { id: credentialId }, data: { status: "REVOKED", revokedAt: new Date() } });
    await transaction.activityEvent.create({ data: { workspaceId, userId: actorId, type: "application.credential_revoked", title: "Application credential revoked", description: `Credential ${credentialId} was revoked.`, metadata: { applicationId, principalId, credentialId } } });
    return toCredential(revoked);
  });
  return result;
}

/** Authentication context deliberately contains no user or capability grant. */
export async function authenticateApplicationCredential(token: string) {
  const match = /^papp_([0-9a-f-]{36})_([A-Za-z0-9_-]{32,})$/.exec(token);
  if (!match) return null;
  const credential = await prisma.applicationCredential.findUnique({ where: { id: match[1] }, include: { principal: { include: { application: true } } } });
  if (!credential || credential.status !== "ACTIVE" || credential.principal.status !== "ACTIVE" || credential.principal.application.lifecycleState === "SUSPENDED" || credential.principal.application.lifecycleState === "RETIRED") return null;
  const expected = Buffer.from(credential.secretHash, "hex");
  const actual = Buffer.from(hashCredential(token), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return { applicationId: credential.principal.applicationId, workspaceId: credential.principal.application.workspaceId, principalId: credential.principalId, credentialId: credential.id, actorType: "APPLICATION" as const, userId: null, capabilityGrants: [] as const };
}
