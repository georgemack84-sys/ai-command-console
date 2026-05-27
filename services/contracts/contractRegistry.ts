import type { ContractDefinition, ContractDefinitionInput } from "./contractTypes";
import { computeContractHash } from "./contractHash";
import { assertContractOwnership } from "./contractOwnership";

type ContractRegistryApi = {
  register: (definition: ContractDefinition) => ContractDefinition;
  get: (id: string, version: string) => ContractDefinition | undefined;
  list: () => ContractDefinition[];
};

function makeKey(id: string, version: string) {
  return `${id}@${version}`;
}

export function createContractDefinition(input: ContractDefinitionInput): ContractDefinition {
  assertContractOwnership(input);
  return {
    ...input,
    hash: computeContractHash(input),
  };
}

export function createContractRegistry(): ContractRegistryApi {
  const store = new Map<string, ContractDefinition>();

  return {
    register(definition) {
      const key = makeKey(definition.id, definition.version);
      if (store.has(key)) {
        throw new Error("API_SCHEMA_INVALID");
      }
      store.set(key, { ...definition });
      return definition;
    },
    get(id, version) {
      return store.get(makeKey(id, version));
    },
    list() {
      return Array.from(store.values()).sort((a, b) => a.id.localeCompare(b.id) || a.version.localeCompare(b.version));
    },
  };
}

const globalRegistry = createContractRegistry();

export function registerContract(definition: ContractDefinition) {
  return globalRegistry.register(definition);
}

export function getRegisteredContract(id: string, version: string) {
  return globalRegistry.get(id, version);
}

export function listRegisteredContracts() {
  return globalRegistry.list();
}
