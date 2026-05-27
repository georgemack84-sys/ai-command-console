import { describe, expect, it } from "vitest";

import { CONSTITUTIONAL_FORECAST_CONSTRAINT, isForecastRestrictionIncreaseAllowed } from "@/services/constitutional/recoveryConstraints";

describe("constitutional forecast constraints", () => {
  it("keeps forecasts advisory-only and unable to reduce governance", () => {
    expect(CONSTITUTIONAL_FORECAST_CONSTRAINT.forecastsAreAdvisoryOnly).toBe(true);
    expect(CONSTITUTIONAL_FORECAST_CONSTRAINT.forecastsCannotReduceGovernance).toBe(true);
    expect(isForecastRestrictionIncreaseAllowed("FREEZE")).toBe(true);
  });
});
