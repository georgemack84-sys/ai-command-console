import { redactConfig } from "./redactConfig";

export function guardConfigExposure(config: Record<string, unknown>) {
  return redactConfig(config);
}
