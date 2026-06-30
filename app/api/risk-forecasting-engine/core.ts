import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRiskForecastObservabilitySurface,
  getRiskForecastingEngineContract,
  replayRiskForecasting,
  runRiskForecasting,
  validateRiskForecasting,
} from "@/services/risk-forecasting-engine";
import type { RiskForecastingInput, RiskForecastingReport } from "@/types/risk-forecasting-engine";

export async function requireRiskForecastingUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): RiskForecastingInput {
  return body as RiskForecastingInput;
}

function reportFromBody(body: Record<string, unknown>): RiskForecastingReport {
  return (body.report as RiskForecastingReport | undefined) ?? runRiskForecasting(inputFromBody(body));
}

export function contractResponse() { return getRiskForecastingEngineContract(); }
export async function forecastRequest(request: Request) { return runRiskForecasting(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateRiskForecasting(reportFromBody(await readBody(request))); }
export async function repositoryRequest(request: Request) { return reportFromBody(await readBody(request)).repository; }
export async function explainRequest(request: Request) {
  const report = reportFromBody(await readBody(request));
  return {
    report_id: report.report_id,
    explanations: report.forecasts.map((forecast) => ({
      forecast_id: forecast.forecast_id,
      forecast_type: forecast.forecast_type,
      explanation: forecast.explanation,
      assumptions: forecast.assumptions,
      constraints: forecast.constraints,
    })),
  };
}
export async function replayRequest(request: Request) { return replayRiskForecasting(reportFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildRiskForecastObservabilitySurface();
  return buildRiskForecastObservabilitySurface(reportFromBody(await readBody(request)));
}
