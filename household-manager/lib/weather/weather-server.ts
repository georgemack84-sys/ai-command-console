import "server-only";
import type { WeatherForecast } from "./weather-service";

type WeatherRequest = { latitude: number; longitude: number; timezone: string; label: string; source: "HOUSEHOLD" | "CURRENT_DEVICE" };
type OpenMeteoResponse = { current: { time: string; temperature_2m: number; apparent_temperature: number; weather_code: number }; hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: number[]; wind_speed_10m: number[]; weather_code: number[] }; daily: { temperature_2m_max: number[]; temperature_2m_min: number[] } };
const cache = new Map<string, { expiresAt: number; forecast: WeatherForecast }>();
export async function getWeatherForecast(request: WeatherRequest): Promise<WeatherForecast> {
  const key = `${request.latitude}:${request.longitude}:${request.timezone}:${request.source}`; const existing = cache.get(key); if (existing && existing.expiresAt > Date.now()) return existing.forecast;
  const query = new URLSearchParams({ latitude: String(request.latitude), longitude: String(request.longitude), current: "temperature_2m,apparent_temperature,weather_code", hourly: "temperature_2m,precipitation_probability,wind_speed_10m,weather_code", daily: "temperature_2m_max,temperature_2m_min", temperature_unit: "fahrenheit", timezone: request.timezone, forecast_days: "1" });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`); if (!response.ok) throw new Error("Weather is temporarily unavailable.");
  const data = await response.json() as OpenMeteoResponse; const currentIndex = Math.max(0, data.hourly.time.findIndex((time) => time >= data.current.time));
  const hourly = data.hourly.time.slice(currentIndex, currentIndex + 12).map((time, index) => { const i = currentIndex + index; return { time, temperature: data.hourly.temperature_2m[i], precipitationProbability: data.hourly.precipitation_probability[i], windSpeed: data.hourly.wind_speed_10m[i], weatherCode: data.hourly.weather_code[i] }; });
  const forecast: WeatherForecast = { locationLabel: request.label, source: request.source, observedAt: data.current.time, temperature: data.current.temperature_2m, apparentTemperature: data.current.apparent_temperature, high: data.daily.temperature_2m_max[0], low: data.daily.temperature_2m_min[0], weatherCode: data.current.weather_code, precipitationProbability: hourly[0]?.precipitationProbability ?? 0, hourly };
  cache.set(key, { forecast, expiresAt: Date.now() + 15 * 60_000 }); return forecast;
}
