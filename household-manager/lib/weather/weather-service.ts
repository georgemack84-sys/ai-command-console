import type { EffectiveLocation } from "../location/types";

export type HourlyForecast = {
  time: string;
  temperature: number;
  precipitationProbability: number;
  windSpeed: number;
  weatherCode: number;
};

export type WeatherForecast = {
  locationLabel: string;
  source: EffectiveLocation["source"];
  observedAt: string;
  temperature: number;
  apparentTemperature: number;
  high: number;
  low: number;
  weatherCode: number;
  precipitationProbability: number;
  hourly: HourlyForecast[];
};

export class WeatherService {
  async getForecast(location: EffectiveLocation): Promise<WeatherForecast> {
    const query = new URLSearchParams({
      latitude: String(location.latitude), longitude: String(location.longitude), timezone: location.timezone,
      label: location.label, source: location.source
    });
    const response = await fetch(`/api/weather?${query}`);
    if (!response.ok) throw new Error("Weather is temporarily unavailable. Please try again.");
    return (await response.json()) as WeatherForecast;
  }
}

export function weatherPresentation(weatherCode: number): { label: string; icon: string } {
  if (weatherCode === 0) return { label: "Clear", icon: "☀" };
  if ([1, 2].includes(weatherCode)) return { label: "Partly cloudy", icon: "⛅" };
  if (weatherCode === 3) return { label: "Overcast", icon: "☁" };
  if ([45, 48].includes(weatherCode)) return { label: "Foggy", icon: "〰" };
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return { label: "Drizzle", icon: "🌦" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return { label: "Rain", icon: "🌧" };
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return { label: "Snow", icon: "❄" };
  return { label: "Thunderstorms", icon: "⛈" };
}
