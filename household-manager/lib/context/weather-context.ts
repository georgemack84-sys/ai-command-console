import type { WeatherForecast } from "../weather/weather-service";
import type { WeatherContext } from "./types";

export function buildWeatherContext(forecast: WeatherForecast): WeatherContext {
  const rainy = forecast.hourly.filter((hour) => hour.precipitationProbability >= 70);
  const precipitationWindows = rainy.map((hour) => ({ start: hour.time, end: new Date(new Date(hour.time).getTime() + 60 * 60 * 1000).toISOString(), probability: hour.precipitationProbability }));
  const severeConditions = rainy.some((hour) => hour.weatherCode >= 95) ? "STORM" : rainy.length ? "RAIN" : "NONE";
  return { current: { temperature: forecast.temperature, apparentTemperature: forecast.apparentTemperature, weatherCode: forecast.weatherCode }, today: { high: forecast.high, low: forecast.low, precipitationProbability: forecast.precipitationProbability }, precipitationWindows, severeConditions, outdoorSuitability: severeConditions === "STORM" ? "POOR" : rainy.length ? "LIMITED" : "GOOD", forecast };
}
