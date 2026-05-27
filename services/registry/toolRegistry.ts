import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";
import {
  toolMigrationManifestDocumentSchema,
  toolAdapterSchema,
  toolPolicySchema,
  toolVersionLineageDocumentSchema,
  toolRegistryDocumentSchema,
  toolRegistryEntrySchema,
  type ToolAdapter,
  type ToolMigrationManifestDocument,
  type ToolPolicy,
  type ToolVersionLineageDocument,
  type ToolRegistryDocument,
} from "@/schemas/toolRegistrySchema";
import { validateRegistryDocument } from "./registryValidator";

export type ToolRegistryEntry = z.infer<typeof toolRegistryEntrySchema>;

const REGISTRY_ROOT = path.resolve(process.cwd(), "tool-registry");
const REGISTRY_DOCUMENT_PATH = path.join(REGISTRY_ROOT, "registry.json");
const REGISTRY_LINEAGES_PATH = path.join(REGISTRY_ROOT, "lineages.json");
const REGISTRY_MIGRATIONS_PATH = path.join(REGISTRY_ROOT, "migrations", "version-migrations.json");

function readJsonFile<T>(relativePath: string, schema: { parse: (value: unknown) => T }) {
  const filePath = path.join(REGISTRY_ROOT, relativePath);
  const contents = fs.readFileSync(filePath, "utf8");
  return schema.parse(JSON.parse(contents));
}

function loadRegistryDocument(): ToolRegistryDocument {
  const contents = fs.readFileSync(REGISTRY_DOCUMENT_PATH, "utf8");
  return toolRegistryDocumentSchema.parse(JSON.parse(contents));
}

function loadRegistryLineages(): ToolVersionLineageDocument {
  const contents = fs.readFileSync(REGISTRY_LINEAGES_PATH, "utf8");
  return toolVersionLineageDocumentSchema.parse(JSON.parse(contents));
}

function loadRegistryMigrationManifests(): ToolMigrationManifestDocument {
  const contents = fs.readFileSync(REGISTRY_MIGRATIONS_PATH, "utf8");
  return toolMigrationManifestDocumentSchema.parse(JSON.parse(contents));
}

function loadPoliciesByRef(document: ToolRegistryDocument) {
  const policiesByRef: Record<string, ToolPolicy> = {};
  for (const entry of document.tools) {
    policiesByRef[entry.policyRef] = readJsonFile(entry.policyRef, toolPolicySchema);
  }
  return policiesByRef;
}

function loadAdaptersByRef(document: ToolRegistryDocument) {
  const adaptersByRef: Record<string, ToolAdapter> = {};
  for (const entry of document.tools) {
    adaptersByRef[entry.adapterRef] = readJsonFile(entry.adapterRef, toolAdapterSchema);
  }
  return adaptersByRef;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function loadCanonicalRegistryState() {
  const document = loadRegistryDocument();
  const lineages = loadRegistryLineages();
  const migrationManifests = loadRegistryMigrationManifests();
  const policiesByRef = loadPoliciesByRef(document);
  const adaptersByRef = loadAdaptersByRef(document);
  const validation = validateRegistryDocument({
    document,
    policiesByRef,
    adaptersByRef,
    lineages,
    migrationManifests,
  });

  if (!validation.valid) {
    throw new Error(`Canonical registry validation failed: ${validation.reasons.join(",")}`);
  }

  return {
    document,
    lineages,
    migrationManifests,
    policiesByRef,
    adaptersByRef,
  };
}

const CANONICAL_REGISTRY_STATE = loadCanonicalRegistryState();

export function getToolRegistry() {
  return clone(CANONICAL_REGISTRY_STATE.document.tools);
}

export function getToolRegistryVersion() {
  return CANONICAL_REGISTRY_STATE.document.registryVersion;
}

export function getCanonicalRegistryDocument() {
  return clone(CANONICAL_REGISTRY_STATE.document);
}

export function getCanonicalRegistryLineages() {
  return clone(CANONICAL_REGISTRY_STATE.lineages);
}

export function getCanonicalRegistryMigrationManifests() {
  return clone(CANONICAL_REGISTRY_STATE.migrationManifests);
}

export function getCanonicalRegistryPolicies() {
  return clone(CANONICAL_REGISTRY_STATE.policiesByRef);
}

export function getCanonicalRegistryAdapters() {
  return clone(CANONICAL_REGISTRY_STATE.adaptersByRef);
}

export function getRegistryEntryByCanonicalId(canonicalId: string) {
  const entry = CANONICAL_REGISTRY_STATE.document.tools.find((candidate) => candidate.canonicalId === canonicalId);
  return entry ? clone(entry) : null;
}
