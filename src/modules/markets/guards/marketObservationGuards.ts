import { EdgeBookError } from "../../../core";
import type { MarketObservation } from "../schemas/marketObservationTypes";
import { validateMarketObservationSchema } from "../validators/marketObservationValidator";

export function assertMarketObservationSchemaValid(
  observation: Partial<MarketObservation> & Record<string, unknown>,
): { status: "VALID"; observation: Partial<MarketObservation> & Record<string, unknown> } {
  const validation = validateMarketObservationSchema(observation);

  if (validation.status === "REJECTED") {
    throw new EdgeBookError("VALIDATION_FAILED", validation.reasons.join("; "));
  }

  return { status: "VALID", observation };
}
