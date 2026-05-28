import { toDeterministicJson } from "./deterministicJson";

export function canonicalSerialize(value: unknown) {
  return toDeterministicJson(value);
}
