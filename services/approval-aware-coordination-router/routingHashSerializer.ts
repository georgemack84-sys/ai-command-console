import { hashContainmentValue } from "@/services/coordination-containment/containmentHasher";
import { serializeContainmentValue } from "@/services/coordination-containment/containmentSerializer";

export function serializeRoutingValue(value: unknown): string {
  return serializeContainmentValue(value);
}

export function hashRoutingValue(namespace: string, value: unknown): string {
  return hashContainmentValue(namespace, value);
}
